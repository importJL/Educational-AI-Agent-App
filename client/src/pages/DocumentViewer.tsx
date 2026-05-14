import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, ZoomIn, ZoomOut, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type TaskType = "Summarize" | "Extract Key Points" | "Generate Diagram/Infographic description" | "Custom Instructions";

export default function DocumentViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageContent, setPageContent] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [taskType, setTaskType] = useState<TaskType>("Summarize");
  const [customInstructions, setCustomInstructions] = useState("");
  const [pageStart, setPageStart] = useState<number | undefined>();
  const [pageEnd, setPageEnd] = useState<number | undefined>();
  const [taskResult, setTaskResult] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<any>(null);

  const documentsUpload = trpc.documents.upload.useMutation();
  const tasksExecute = trpc.tasks.execute.useMutation();

  // Load PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Cancel any pending render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result as ArrayBuffer;
      try {
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        await renderPage(pdf, 1);
      } catch (error) {
        toast.error("Failed to load PDF");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Render PDF page
  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    try {
      // Cancel previous render task if still running
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoomLevel / 100 });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Clear canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // Extract text
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(" ");
      setPageContent(text);
    } catch (error) {
      if ((error as any).name !== "RenderingCancelledException") {
        console.error("Error rendering page:", error);
      }
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, currentPage);
    }
  }, [zoomLevel, currentPage, pdfDoc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  // Execute task
  const handleExecuteTask = async () => {
    if (!file || !pageContent) {
      toast.error("Please load a PDF first");
      return;
    }

    setIsExecuting(true);
    try {
      // First, upload the document if not already uploaded
      let documentId: number;
      const base64Data = await new Promise<string>((resolve) => {
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

      // Execute task
      const result = await tasksExecute.mutateAsync({
        documentId,
        pageContent,
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

  // Handle page navigation with render cancellation
  const handlePageChange = (page: number) => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
    setCurrentPage(page);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(taskResult);
    toast.success("Copied to clipboard");
  };

  // Download result
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
    <div className="flex h-full gap-4 p-4 bg-background">
      {/* Left Panel - PDF Viewer */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <Card className="flex-1 flex flex-col p-4 overflow-hidden">
          {!pdfDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-lg">
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground mb-2">Upload a PDF Document</p>
                <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to select</p>
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
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    →
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">{zoomLevel}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (renderTaskRef.current) {
                      renderTaskRef.current.cancel();
                      renderTaskRef.current = null;
                    }
                    setFile(null);
                    setPdfDoc(null);
                    setTaskResult("");
                    setCurrentPage(1);
                    setTotalPages(0);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* PDF Canvas */}
              <div className="flex-1 overflow-auto flex items-center justify-center bg-muted rounded-lg">
                <canvas ref={canvasRef} className="max-w-full max-h-full" />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Right Panel - Task Execution */}
      <div className="w-96 flex flex-col gap-4 overflow-y-auto">
        {/* Task Selection */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Task Configuration</h3>
          
          <div className="space-y-4">
            {/* Page Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Page Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Start"
                  value={pageStart || ""}
                  onChange={(e) => setPageStart(e.target.value ? parseInt(e.target.value) : undefined)}
                  min={1}
                  max={totalPages}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="End"
                  value={pageEnd || ""}
                  onChange={(e) => setPageEnd(e.target.value ? parseInt(e.target.value) : undefined)}
                  min={1}
                  max={totalPages}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Task Type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Task Type</label>
              <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Summarize">Summarize</SelectItem>
                  <SelectItem value="Extract Key Points">Extract Key Points</SelectItem>
                  <SelectItem value="Generate Diagram/Infographic description">Generate Diagram/Infographic description</SelectItem>
                  <SelectItem value="Custom Instructions">Custom Instructions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Instructions */}
            {taskType === "Custom Instructions" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Your Instructions</label>
                <Textarea
                  placeholder="Enter your custom instructions for the AI..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
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
        </Card>

        {/* Task Result */}
        {taskResult && (
          <Card className="p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Result</h3>
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
                  onClick={() => handleDownload("json")}
                  title="Download as JSON"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("text")}
                  title="Download as text"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-muted rounded-lg p-4 text-sm text-foreground">
              <Streamdown>{taskResult}</Streamdown>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
