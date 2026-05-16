import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  Copy,
  Download,
  Bookmark,
  LayoutGrid,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min?url";

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
  const isRenderingRef = useRef(false);

  const documentsUpload = trpc.documents.upload.useMutation();
  const tasksExecute = trpc.tasks.execute.useMutation();
  const utils = trpc.useUtils();
  const saveMutation = trpc.saves.create.useMutation({
    onSuccess: () => {
      utils.saves.list.invalidate();
    },
  });

  // Load PDF
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

  // Render PDF page with proper cancellation
  const renderPage = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    waitForExisting: boolean = false
  ) => {
    try {
      const existingTask = renderTasksRef.current.get(pageNum);
      if (existingTask) {
        existingTask.cancel();
        if (waitForExisting) {
          try {
            await existingTask.promise;
          } catch {}
        }
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

  // Setup IntersectionObserver for lazy loading and page tracking
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

    pageRefs.current.forEach((canvas, pageNum) => {
      observerRef.current?.observe(canvas);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [pdfDoc, useLazyLoading, totalPages, renderedPages]);

  // Render current page if needed in single page mode
  useEffect(() => {
    if (viewMode === "single" && pdfDoc && !renderedPages.has(currentPage)) {
      renderPage(pdfDoc, currentPage);
      setRenderedPages(prev => new Set(prev).add(currentPage));
    }
  }, [currentPage, viewMode, pdfDoc]);

  // Render all pages on initial load (non-lazy)
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

  // Track container size for fit calculation
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      renderTasksRef.current.forEach(task => task.cancel());
      renderTasksRef.current.clear();
      observerRef.current?.disconnect();
    };
  }, []);

  // Scroll wheel zoom with non-passive listener
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

  // Helper function to extract text from a specific page
  const extractPageText = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number
  ): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str).join(" ");
  };

  // Execute task
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

      // Handle multi-page extraction if page range is specified
      if (
        pageStart !== undefined &&
        pageEnd !== undefined &&
        pageStart !== pageEnd &&
        pdfDoc
      ) {
        // Extract text from each page in the range
        const contents: string[] = [];
        for (let p = pageStart; p <= pageEnd; p++) {
          const text = await extractPageText(pdfDoc, p);
          contents.push(`--- Page ${p} ---\n${text}`);
        }
        pageContents = contents;
        contentToSend = contents.join("\n\n---\n\n");
      } else {
        // Single page or no range: use current page content
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

      // Execute task
      const result = await tasksExecute.mutateAsync({
        documentId,
        pageContent: pageContents ? undefined : contentToSend,
        pageContents: pageContents,
        taskType,
        customInstructions: customInstructions || undefined,
        pageStart,
        pageEnd,
      });

      setTaskResult(result.result);
      toast.success("Task executed successfully");
    } catch (error) {
      toast.error("Failed to execute task");
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle page navigation with scroll
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const canvas = pageRefs.current.get(page);
    if (canvas && scrollContainerRef.current) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll detection for zoom
  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, []);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(taskResult);
    toast.success("Copied to clipboard");
  };

  // Save result
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

  // Download result
  const handleDownload = (format: "json" | "text") => {
    const content =
      format === "json"
        ? JSON.stringify(
            { taskType, result: taskResult, date: new Date() },
            null,
            2
          )
        : taskResult;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`
    );
    element.setAttribute(
      "download",
      `result.${format === "json" ? "json" : "txt"}`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Downloaded as ${format}`);
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full gap-1 p-2 bg-background"
    >
      {/* Left Panel - PDF Viewer */}
      <ResizablePanel defaultSize={60} minSize={30}>
        <div className="flex flex-col gap-4 h-full pr-1">
          <Card className="flex-1 flex flex-col p-4 overflow-hidden">
            {!pdfDoc ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-lg">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-foreground mb-2">
                    Upload a PDF Document
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to select
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                {/* PDF Controls */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      title="Previous page"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      title="Next page"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                      title="Zoom out (Shift+Scroll)"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-14 text-center">
                      {zoomLevel}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}
                      title="Zoom in (Shift+Scroll)"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 border-l border-border pl-2">
                    <Button
                      variant={viewMode === "single" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("single")}
                      title="Single page view"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "multiple" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("multiple")}
                      title="Multiple page view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      renderTasksRef.current.forEach(task => task.cancel());
                      renderTasksRef.current.clear();
                      setFile(null);
                      setPdfDoc(null);
                      setTaskResult("");
                      setDocumentId(null);
                      setCurrentPage(1);
                      setTotalPages(0);
                      setRenderedPages(new Set());
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>

                {/* PDF Canvas */}
                <div
                  ref={scrollContainerRef}
                  className={`flex-1 overflow-auto flex ${viewMode === "single" ? "items-center justify-center" : "flex-col items-center"} gap-4 py-4 bg-muted rounded-lg`}
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
                        className="shadow-lg bg-white"
                        style={canvasStyle}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel - Task Execution */}
      <ResizablePanel defaultSize={40} minSize={20} maxSize={50}>
        <div className="flex flex-col gap-2 overflow-y-auto h-full pl-1">
          {/* Task Selection */}
          <Card className="p-4">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="font-semibold text-foreground">
                Task Configuration
              </h3>
              {isConfigOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {isConfigOpen && (
              <div className="space-y-3 mt-3">
                {/* Page Range */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Page Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Start"
                      value={pageStart || ""}
                      onChange={e =>
                        setPageStart(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      min={1}
                      max={totalPages}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="End"
                      value={pageEnd || ""}
                      onChange={e =>
                        setPageEnd(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      min={1}
                      max={totalPages}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Task Type */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Task Type
                  </label>
                  <Select
                    value={taskType}
                    onValueChange={value => setTaskType(value as TaskType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Summarize">Summarize</SelectItem>
                      <SelectItem value="Extract Key Points">
                        Extract Key Points
                      </SelectItem>
                      <SelectItem value="Generate Diagram/Infographic description">
                        Generate Diagram/Infographic description
                      </SelectItem>
                      <SelectItem value="Custom Instructions">
                        Custom Instructions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Instructions */}
                {taskType === "Custom Instructions" && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Your Instructions
                    </label>
                    <Textarea
                      placeholder="Enter your custom instructions for the AI..."
                      value={customInstructions}
                      onChange={e => setCustomInstructions(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                )}

                {/* Execute Button */}
                <Button
                  onClick={handleExecuteTask}
                  disabled={isExecuting || !pdfDoc}
                  className="w-full"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    "Execute Task"
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Task Result */}
          {taskResult && (
            <Card className="p-4 flex-1 flex flex-col min-h-0">
              <button
                onClick={() => setIsResultsOpen(!isResultsOpen)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="font-semibold text-foreground">Result</h3>
                {isResultsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isResultsOpen && (
                <>
                  <div className="flex items-center justify-between mt-1">
                    <div />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        title="Save result"
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Download result"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDownload("json")}
                          >
                            Download as JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload("text")}
                          >
                            Download as Text
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-muted rounded-lg p-4 text-sm text-foreground">
                    <Streamdown>{taskResult}</Streamdown>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
