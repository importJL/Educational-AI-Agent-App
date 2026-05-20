import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { MaterialIcon } from "@/components/MaterialIcon";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min?url";
import { AgentFlowViewer } from "@/components/AgentFlowViewer";
import { useTheme } from "@/contexts/ThemeContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const LAZY_LOAD_THRESHOLD = 50;
const BUFFER_PAGES = 5;

interface RenderTask {
  cancel: () => void;
  promise: Promise<void>;
}

type TaskType =
  | "Summarize"
  | "Extract Key Points"
  | "Generate Diagram/Infographic description"
  | "Custom Instructions";

export default function DocumentViewer() {
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageContent, setPageContent] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<"single" | "multiple">("multiple");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const pageSizesRef = useRef<Map<number, { width: number; height: number }>>(new Map());
  const [taskType, setTaskType] = useState<TaskType>("Summarize");
  const [customInstructions, setCustomInstructions] = useState("");
  const [pageStart, setPageStart] = useState<number | undefined>();
  const [pageEnd, setPageEnd] = useState<number | undefined>();
  const [taskResult, setTaskResult] = useState("");
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [streamController, setStreamController] = useState<AbortController | null>(null);
  const [fullModal, setFullModal] = useState<{ open: boolean; title?: string; content?: string }>({ open: false });
  const [agentFlowCollapsed, setAgentFlowCollapsed] = useState(false);
  const [outputCollapsed, setOutputCollapsed] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [useLazyLoading, setUseLazyLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const documentsUpload = trpc.documents.upload.useMutation();
  const tasksExecute = trpc.tasks.execute.useMutation();
  const utils = trpc.useUtils();
  const saveMutation = trpc.saves.create.useMutation({
    onSuccess: () => {
      utils.saves.list.invalidate();
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    renderTasksRef.current.forEach(task => task.cancel());
    renderTasksRef.current.clear();

    setFile(selectedFile);
    setRenderedPages(new Set());
    const reader = new FileReader();
    reader.onload = async event => {
      const data = event.target?.result as ArrayBuffer;
      try {
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setUseLazyLoading(pdf.numPages > LAZY_LOAD_THRESHOLD);
      } catch (error) {
        toast.error("Failed to load PDF");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const renderPage = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
  ) => {
    try {
      const existingTask = renderTasksRef.current.get(pageNum);
      if (existingTask) {
        existingTask.cancel();
        try { await existingTask.promise; } catch {}
      }

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      pageSizesRef.current.set(pageNum, { width: viewport.width, height: viewport.height });
      const canvas = pageRefs.current.get(pageNum);
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTasksRef.current.set(pageNum, { cancel: renderTask.cancel.bind(renderTask), promise: renderTask.promise });
      await renderTask.promise;
      renderTasksRef.current.delete(pageNum);

      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(" ");

      if (pageNum === currentPage) {
        setPageContent(text);
      }
    } catch (error) {
      if ((error as any).name !== "RenderingCancelledException") {
        console.error("Error rendering page:", error);
      }
    }
  };

  useEffect(() => {
    if (!scrollContainerRef.current || !useLazyLoading) return;

    const visiblePages = new Set<number>();

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const pageNum = parseInt(entry.target.getAttribute("data-page") || "0");
          if (entry.isIntersecting) {
            visiblePages.add(pageNum);
            const pagesToRender = new Set(visiblePages);
            for (let i = Math.max(1, pageNum - BUFFER_PAGES); i <= Math.min(totalPages, pageNum + BUFFER_PAGES); i++) {
              pagesToRender.add(i);
            }

            pagesToRender.forEach(p => {
              if (!renderedPages.has(p) && pdfDoc) {
                renderPage(pdfDoc, p);
                setRenderedPages(prev => new Set(Array.from(prev).concat(p)));
              }
            });

            setCurrentPage(pageNum);
            pdfDoc?.getPage(pageNum).then(page => {
              page.getTextContent().then(textContent => {
                const text = textContent.items.map((item: any) => item.str).join(" ");
                setPageContent(text);
              });
            });
          } else {
            visiblePages.delete(pageNum);
          }
        });
      },
      { root: scrollContainerRef.current, rootMargin: "100px" }
    );

    pageRefs.current.forEach((canvas) => {
      observerRef.current?.observe(canvas);
    });

    return () => observerRef.current?.disconnect();
  }, [pdfDoc, useLazyLoading, totalPages, renderedPages]);

  useEffect(() => {
    if (viewMode === "single" && pdfDoc && !renderedPages.has(currentPage)) {
      renderPage(pdfDoc, currentPage);
      setRenderedPages(prev => new Set(prev).add(currentPage));
    }
  }, [currentPage, viewMode, pdfDoc]);

  useEffect(() => {
    if (!pdfDoc || useLazyLoading) return;
    const renderAll = async () => {
      for (let i = 1; i <= totalPages; i++) {
        if (!renderedPages.has(i)) {
          await renderPage(pdfDoc, i);
          setRenderedPages(prev => new Set(Array.from(prev).concat(i)));
        }
      }
    };
    renderAll();
  }, [pdfDoc]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [viewMode]);

  useEffect(() => {
    return () => {
      renderTasksRef.current.forEach(task => task.cancel());
      renderTasksRef.current.clear();
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -25 : 25;
        setZoomLevel(prev => Math.max(25, Math.min(400, prev + delta)));
      }
    };

    container.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => container.removeEventListener("wheel", handleWheelEvent);
  }, [pdfDoc]);

  const extractPageText = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number
  ): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str).join(" ");
  };

  const handleExecuteTask = async () => {
    if (!file || !pageContent) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsExecuting(true);
    try {
      let documentId: number;
      let contentToSend: string;
      let pageContents: string[] | undefined;

      if (pageStart !== undefined && pageEnd !== undefined && pageStart !== pageEnd && pdfDoc) {
        const contents: string[] = [];
        for (let p = pageStart; p <= pageEnd; p++) {
          const text = await extractPageText(pdfDoc, p);
          contents.push(`--- Page ${p} ---\n${text}`);
        }
        pageContents = contents;
        contentToSend = contents.join("\n\n---\n\n");
      } else {
        contentToSend = pageContent;
      }

      const base64Data = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      const uploadResult = await documentsUpload.mutateAsync({
        fileName: file.name,
        fileData: base64Data,
        fileSize: file.size,
        pageCount: totalPages,
      });

      documentId = uploadResult.document!.id;
      setDocumentId(documentId);

      setAgentLogs([]);
      setTaskResult("");

      const controller = new AbortController();
      setStreamController(controller);

      try {
        const resp = await fetch("/api/agents/execute-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            pageContent: pageContents ? undefined : contentToSend,
            pageContents: pageContents,
            taskType,
            customInstructions: customInstructions || undefined,
            pageStart,
            pageEnd,
          }),
          signal: controller.signal,
        });

        if (!resp.body) throw new Error("No response body from stream");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let parts = buf.split("\n\n");
          buf = parts.pop() || "";
          for (const part of parts) {
            const line = part.replace(/^data:\s*/i, "");
            if (!line.trim()) continue;
            try {
              const obj = JSON.parse(line);
              if (obj.type === "log") {
                setAgentLogs(prev => [...prev, obj.payload]);
              } else if (obj.type === "final") {
                setTaskResult(obj.payload.result);
              } else if (obj.type === "error") {
                toast.error(`Agent error: ${obj.payload.message}`);
              }
            } catch (e) {
              console.error("Failed to parse stream chunk", e, line);
            }
          }
        }
        toast.success("Task executed successfully");
      } catch (err) {
        if ((err as any).name === "AbortError") {
          toast.error("Stream aborted");
        } else {
          console.error(err);
          toast.error("Failed to execute task");
        }
      } finally {
        setIsExecuting(false);
        setStreamController(null);
      }
    } catch (error) {
      toast.error("Failed to execute task");
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const canvas = pageRefs.current.get(page);
    if (canvas && scrollContainerRef.current) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => { isScrollingRef.current = false; }, 150);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(taskResult);
    toast.success("Copied to clipboard");
  };

  const handleSave = async () => {
    if (!documentId || !file) {
      toast.error("No document or result to save");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        documentId,
        documentName: file.name,
        pageStart,
        pageEnd,
        taskType,
        customInstructions: customInstructions || undefined,
        response: taskResult,
        responseFormat: "markdown",
      });
      toast.success("Result saved");
    } catch (error) {
      toast.error("Failed to save result");
      console.error(error);
    }
  };

  const handleDownload = (format: "json" | "text") => {
    const content = format === "json"
      ? JSON.stringify({ taskType, result: taskResult, date: new Date() }, null, 2)
      : taskResult;
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute("download", `result.${format === "json" ? "json" : "txt"}`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Downloaded as ${format}`);
  };

  return (
    <>
      <div className="resizable-panel-group" data-direction="horizontal" style={{ height: "100%", gap: 4, padding: 8, background: "#f5f5f5" }}>
        {/* Left Panel - PDF Viewer */}
        <div style={{ flex: "60 1 0%", overflow: "hidden", paddingRight: 4 }}>
          <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", margin: 0 }}>
            <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "hidden" }}>
              {!pdfDoc ? (
                <div className="flex flex-col items-center justify-center" style={{
                  flex: 1, border: "2px dashed #ccc", borderRadius: 8,
                  gap: 16
                }}>
                  <MaterialIcon icon="Upload" className="grey-text" style={{ fontSize: 48 }} />
                  <div className="center-align">
                    <p style={{ fontWeight: 500, marginBottom: 8 }}>Upload a PDF Document</p>
                    <p className="grey-text" style={{ fontSize: 13, marginBottom: 16 }}>Drag and drop or click to select</p>
                  </div>
                  <button className="btn waves-effect waves-light" onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between" style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e0e0e0", gap: 8, flexWrap: "wrap" }}>
                    <div className="flex items-center gap-2">
                      <button className="btn-flat btn-small" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <MaterialIcon icon="ChevronUp" />
                      </button>
                      <span className="grey-text" style={{ fontSize: 13, minWidth: 100, textAlign: "center" }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button className="btn-flat btn-small" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        <MaterialIcon icon="ChevronDown" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn-flat btn-small" onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}>
                        <MaterialIcon icon="ZoomOut" />
                      </button>
                      <span className="grey-text" style={{ fontSize: 13, width: 56, textAlign: "center" }}>{zoomLevel}%</span>
                      <button className="btn-flat btn-small" onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}>
                        <MaterialIcon icon="ZoomIn" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1" style={{ borderLeft: "1px solid #e0e0e0", paddingLeft: 8 }}>
                      <button className={`btn-flat btn-small ${viewMode === "single" ? "blue lighten-4" : ""}`} onClick={() => setViewMode("single")}>
                        <MaterialIcon icon="FileText" />
                      </button>
                      <button className={`btn-flat btn-small ${viewMode === "multiple" ? "blue lighten-4" : ""}`} onClick={() => setViewMode("multiple")}>
                        <MaterialIcon icon="LayoutGrid" />
                      </button>
                    </div>
<button className={`btn-flat btn-small clear-btn-beige ${theme === "dark" ? "white-text" : ""}`} onClick={() => {
  renderTasksRef.current.forEach(task => task.cancel());
  renderTasksRef.current.clear();
  setFile(null);
  setPdfDoc(null);
  setTaskResult("");
  setDocumentId(null);
  setCurrentPage(1);
  setTotalPages(0);
  setRenderedPages(new Set());
}} style={{ 
  display: 'flex',
  alignItems: 'center'
}}>
  <MaterialIcon icon="X" className="mr-1" /> Clear
</button>
                  </div>

                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto"
                    style={{
                      display: "flex",
                      flexDirection: viewMode === "single" ? "column" : "column",
                      alignItems: viewMode === "single" ? "center" : "center",
                      gap: 16, padding: "16px 0",
                      background: "#f0f0f0", borderRadius: 8
                    }}
                    onScroll={handleScroll}
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                      const isSingleView = viewMode === "single";
                      const isVisible = !isSingleView || pageNum === currentPage;
                      const baseSize = pageSizesRef.current.get(pageNum);
                      const zoomScale = zoomLevel / 100;
                      const fitScale = baseSize && containerSize.width > 0
                        ? (isSingleView
                            ? Math.min(
                                Math.max(containerSize.width - 40, 100) / baseSize.width,
                                Math.max(containerSize.height - 40, 100) / baseSize.height
                              )
                            : Math.max(containerSize.width - 40, 100) / baseSize.width)
                        : 1;
                      const displayScale = zoomScale * fitScale;
                      const canvasStyle: React.CSSProperties = {
                        display: isVisible ? "block" : "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                      };
                      if (baseSize) {
                        canvasStyle.width = Math.round(baseSize.width * displayScale);
                        canvasStyle.height = Math.round(baseSize.height * displayScale);
                      } else {
                        canvasStyle.minHeight = 200;
                      }
                      return (
                        <canvas
                          key={pageNum}
                          ref={el => { if (el) pageRefs.current.set(pageNum, el); }}
                          data-page={pageNum}
                          style={canvasStyle}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="resizable-handle" />

        {/* Right Panel - Task Execution */}
        <div style={{ flex: "40 1 0%", minWidth: 200, maxWidth: "50%", overflow: "hidden" }}>
          <div className="flex flex-col gap-2" style={{ height: "100%", overflow: "auto", paddingLeft: 4 }}>
            {/* Task Configuration */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-content" style={{ padding: 16 }}>
                <button
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="flex items-center justify-between w-full"
                  style={{ background: "none", border: "none", cursor: "pointer", width: "100%", padding: 0 }}
                >
                  <span className="card-title" style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Task Configuration</span>
                  <MaterialIcon icon={isConfigOpen ? "ChevronUp" : "ChevronDown"} className="grey-text" />
                </button>

                {isConfigOpen && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Page Range</label>
                      <div className="flex gap-2">
                        <div className="input-field" style={{ flex: 1, margin: 0 }}>
                          <input
                            type="number" placeholder="Start"
                            value={pageStart || ""}
                            onChange={e => setPageStart(e.target.value ? parseInt(e.target.value) : undefined)}
                            min={1} max={totalPages}
                          />
                        </div>
                        <div className="input-field" style={{ flex: 1, margin: 0 }}>
                          <input
                            type="number" placeholder="End"
                            value={pageEnd || ""}
                            onChange={e => setPageEnd(e.target.value ? parseInt(e.target.value) : undefined)}
                            min={1} max={totalPages}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Task Type</label>
                      <div className="input-field" style={{ margin: 0 }}>
                        <select
                          className="browser-default"
                          value={taskType}
                          onChange={e => setTaskType(e.target.value as TaskType)}
                          style={{ display: "block" }}
                        >
                          <option value="Summarize">Summarize</option>
                          <option value="Extract Key Points">Extract Key Points</option>
                          <option value="Generate Diagram/Infographic description">Generate Diagram/Infographic description</option>
                          <option value="Custom Instructions">Custom Instructions</option>
                        </select>
                      </div>
                    </div>

                    {taskType === "Custom Instructions" && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Your Instructions</label>
                        <div className="input-field" style={{ margin: 0 }}>
                          <textarea
                            className="materialize-textarea"
                            placeholder="Enter your custom instructions for the AI..."
                            value={customInstructions}
                            onChange={e => setCustomInstructions(e.target.value)}
                            style={{ minHeight: 96 }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      className="btn waves-effect waves-light w-full"
                      onClick={handleExecuteTask}
                      disabled={isExecuting || !pdfDoc}
                      style={{ width: "100%" }}
                    >
                      {isExecuting ? (
                        <>
                          <div className="preloader-wrapper small active" style={{ width: 20, height: 20, display: "inline-block", marginRight: 8, verticalAlign: "middle" }}>
                            <div className="spinner-layer spinner-white-only">
                              <div className="circle-clipper left"><div className="circle" /></div>
                              <div className="gap-patch"><div className="circle" /></div>
                              <div className="circle-clipper right"><div className="circle" /></div>
                            </div>
                          </div>
                          Executing...
                        </>
                      ) : "Execute Task"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Task Result */}
            {taskResult && (
              <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", margin: 0, minHeight: 0 }}>
                <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, minHeight: 0 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsResultsOpen(!isResultsOpen)} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <span className="card-title" style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Result</span>
                        <MaterialIcon icon={isResultsOpen ? "ChevronUp" : "ChevronDown"} className="grey-text" />
                      </button>
                      <button
                        className="grey-text"
                        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => setOutputCollapsed(prev => !prev)}
                      >
                        {outputCollapsed ? "Show output" : "Hide output"}
                      </button>
                    </div>
                  </div>

                  {isResultsOpen && (
                    <div className="flex flex-row" style={{ flex: 1, gap: 12, minHeight: 0 }}>
                      {/* Left: Agent Flow side panel */}
                      {agentLogs && agentLogs.length > 0 && !agentFlowCollapsed ? (
                        <div style={{ width: "33%", minWidth: 220, display: "flex", flexDirection: "column" }}>
                          <div className="flex items-center justify-between" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #e0e0e0" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Agent Flow</span>
                            <button
                              className="grey-text"
                              style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                              onClick={() => setAgentFlowCollapsed(true)}
                            >
                              Hide
                            </button>
                          </div>
                          <div className="overflow-auto flex-1" style={{ paddingRight: 8 }}>
                            <AgentFlowViewer
                              logs={agentLogs}
                              onViewFullMessages={(log) =>
                                setFullModal({
                                  open: true,
                                  title: `${log.agent} - Full Messages`,
                                  content: log.messages
                                    ?.map((m: any) => `[${m.role.toUpperCase()}]\n${m.content}`)
                                    .join("\n\n---\n\n"),
                                })
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-2" style={{ paddingTop: 4 }}>
                          <span className="grey-text" style={{ fontSize: 12, fontWeight: 500, padding: "0 8px" }}>Agent Flow</span>
                          <button
                            className="grey-text"
                            style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: "0 8px" }}
                            onClick={() => setAgentFlowCollapsed(false)}
                          >
                            Show
                          </button>
                        </div>
                      )}

                      {/* Right: main output area */}
                      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
                        <div className="flex items-center justify-end" style={{ gap: 8, marginBottom: 8 }}>
                          <button className="btn-flat btn-small" onClick={handleCopy}>
                            <MaterialIcon icon="Copy" />
                          </button>
                          <button className="btn-flat btn-small" onClick={handleSave}>
                            <MaterialIcon icon="Bookmark" />
                          </button>
                          <div className="dropdown-wrapper" style={{ position: "relative", display: "inline-block" }}>
                            <button className="btn-flat btn-small dropdown-trigger" data-target="download-dropdown">
                              <MaterialIcon icon="Download" />
                            </button>
                            <ul id="download-dropdown" className="dropdown-content" style={{ minWidth: 180 }}>
                              <li><a href="#!" onClick={() => handleDownload("json")}>Download as JSON</a></li>
                              <li><a href="#!" onClick={() => handleDownload("text")}>Download as Text</a></li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto" style={{
                          background: "#f0f0f0", borderRadius: 8, padding: 16, fontSize: 14
                        }}>
                          {!outputCollapsed ? (
                            <Streamdown>{taskResult}</Streamdown>
                          ) : (
                            <span className="grey-text" style={{ fontSize: 13 }}>Output hidden. Click "Show output" to reveal.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {fullModal.open && (
        <div className="modal-overlay" onClick={() => setFullModal({ open: false })} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 8, padding: 16, maxWidth: 720,
            width: "90%", maxHeight: "80vh", overflow: "auto",
            boxShadow: "0 16px 48px rgba(0,0,0,0.2)"
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <h5 style={{ margin: 0 }}>{fullModal.title}</h5>
              <button className="btn-flat" onClick={() => setFullModal({ open: false })}>Close</button>
            </div>
            <pre className="whitespace-pre-wrap" style={{ fontSize: 13 }}>{fullModal.content}</pre>
          </div>
        </div>
      )}
    </>
  );
}

export { };
