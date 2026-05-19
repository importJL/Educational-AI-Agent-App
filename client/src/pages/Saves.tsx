import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MaterialIcon } from "@/components/MaterialIcon";
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
        <div className="preloader-wrapper small active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left"><div className="circle" /></div>
            <div className="gap-patch"><div className="circle" /></div>
            <div className="circle-clipper right"><div className="circle" /></div>
          </div>
        </div>
      </div>
    );
  }

  const saves = savesQuery.data || [];

  if (saves.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="center-align">
          <p className="grey-text" style={{ marginBottom: 8 }}>No saved responses yet</p>
          <p className="grey-text" style={{ fontSize: 13 }}>Execute tasks in Document Viewer to save results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto" style={{ height: "100%", padding: 16, background: "#f5f5f5" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h4 style={{ fontWeight: 700, marginBottom: 24 }}>Saved Responses</h4>

        <div className="collection">
          {saves.map((save) => {
            const isExpanded = expandedId === save.id;
            return (
              <div key={save.id}>
                <div
                  className="collection-item"
                  onClick={() => setExpandedId(isExpanded ? null : save.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-start justify-between">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }} className="truncate">{save.documentName}</span>
                        <span className="badge blue lighten-4 blue-text" style={{ float: "none", fontWeight: 500, fontSize: 11 }}>
                          {save.taskType}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        <span>Pages: {save.pageStart || "N/A"} - {save.pageEnd || "N/A"}</span>
                        <span style={{ marginLeft: 16 }}>
                          {formatDistanceToNow(new Date(save.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
                      <button className="btn-flat btn-small" onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : save.id);
                      }}>
                        <MaterialIcon icon={isExpanded ? "EyeOff" : "Eye"} />
                      </button>
                      <button className="btn-flat btn-small" onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(save.id, "json");
                      }}>
                        <MaterialIcon icon="Download" />
                      </button>
                      <button className="btn-flat btn-small" onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(save.id);
                      }}>
                        <MaterialIcon icon="Delete" className="red-text" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0", background: "#fafafa" }}>
                    <div style={{
                      background: "#f0f0f0", borderRadius: 8, padding: 16,
                      fontSize: 14, maxHeight: 384, overflowY: "auto"
                    }}>
                      <Streamdown>{save.response}</Streamdown>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 16 }}>
                      <button
                        className="btn-flat btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(save.response);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <MaterialIcon icon="Copy" className="mr-1" /> Copy
                      </button>
                      <button
                        className="btn-flat btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(save.id, "text");
                        }}
                      >
                        <MaterialIcon icon="Download" className="mr-1" /> Download as Text
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
