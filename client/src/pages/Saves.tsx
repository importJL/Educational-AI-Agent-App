import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { formatDistanceToNow } from "date-fns";

export default function Saves() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const savesQuery = trpc.saves.list.useQuery();
  const deleteSaveMutation = trpc.saves.delete.useMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteSaveMutation.mutateAsync({ id });
      await savesQuery.refetch();
      toast.success("Save deleted");
    } catch (error) {
      toast.error("Failed to delete save");
    }
  };

  const handleDownload = async (id: number, format: "json" | "text") => {
    try {
      const saves = savesQuery.data || [];
      const save = saves.find(s => s.id === id);
      if (!save) {
        toast.error("Save not found");
        return;
      }
      const data = format === "json"
        ? JSON.stringify({
            documentName: save.documentName,
            taskType: save.taskType,
            pageStart: save.pageStart,
            pageEnd: save.pageEnd,
            response: save.response,
            createdAt: save.createdAt,
            model: save.model,
          }, null, 2)
        : `Document: ${save.documentName}\nTask: ${save.taskType}\nPages: ${save.pageStart || "N/A"}-${save.pageEnd || "N/A"}\nDate: ${save.createdAt}\n\n${save.response}`;
      
      const element = document.createElement("a");
      element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
      element.setAttribute("download", `save-${id}.${format === "json" ? "json" : "txt"}`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success(`Downloaded as ${format}`);
    } catch (error) {
      toast.error("Failed to download");
    }
  };

  if (savesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const saves = savesQuery.data || [];

  if (saves.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No saved responses yet</p>
          <p className="text-sm text-muted-foreground">Execute tasks in Document Viewer to save results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-3">
        <h2 className="text-2xl font-bold text-foreground mb-6">Saved Responses</h2>
        
        {saves.map((save) => (
          <Card
            key={save.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setExpandedId(expandedId === save.id ? null : save.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground truncate">{save.documentName}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {save.taskType}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Pages: {save.pageStart || "N/A"} - {save.pageEnd || "N/A"}</p>
                  <p>{formatDistanceToNow(new Date(save.createdAt), { addSuffix: true })}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(expandedId === save.id ? null : save.id);
                  }}
                >
                  {expandedId === save.id ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(save.id, "json");
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(save.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === save.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="bg-muted rounded-lg p-4 text-sm text-foreground max-h-96 overflow-y-auto">
                  <Streamdown>{save.response}</Streamdown>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(save.response);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(save.id, "text");
                    }}
                  >
                    Download as Text
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
