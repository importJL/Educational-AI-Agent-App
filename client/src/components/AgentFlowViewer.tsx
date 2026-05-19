import { useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AgentLog {
  agent: string;
  model: string;
  messages?: Message[];
  responsePreview?: string;
}

interface AgentFlowViewerProps {
  logs: AgentLog[];
  onViewFullMessages?: (log: AgentLog) => void;
}

const getAgentColor = (agent: string) => {
  const colors: Record<string, { badge: string; chip: string }> = {
    orchestrator: { badge: "blue", chip: "blue lighten-5 blue-text" },
    textual: { badge: "purple", chip: "purple lighten-5 purple-text" },
    rerouting: { badge: "green", chip: "green lighten-5 green-text" },
    ocr: { badge: "amber", chip: "amber lighten-5 amber-text" },
  };
  return colors[agent] || { badge: "grey", chip: "grey lighten-4 grey-text" };
};

const truncateContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};

const getRoleBadgeStyle = (role: string) => {
  const styles: Record<string, string> = {
    system: "blue lighten-4 blue-text",
    user: "green lighten-4 green-text",
    assistant: "purple lighten-4 purple-text",
  };
  return styles[role] || "grey lighten-4 grey-text";
};

export function AgentFlowViewer({ logs, onViewFullMessages }: AgentFlowViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<Set<number>>(new Set());
  const [showPreviewFull, setShowPreviewFull] = useState<Set<number>>(new Set());

  const toggleExpanded = (idx: number) => {
    const newSet = new Set(expandedIndex);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedIndex(newSet);
  };

  const toggleShowPreviewFull = (idx: number) => {
    const newSet = new Set(showPreviewFull);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setShowPreviewFull(newSet);
  };

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {logs.map((log, idx) => {
        const isExpanded = expandedIndex.has(idx);
        const showFullPreview = showPreviewFull.has(idx);
        const colors = getAgentColor(log.agent);
        const messageCount = log.messages?.length || 0;

        const messagesByRole = {
          system: log.messages?.filter(m => m.role === "system") || [],
          user: log.messages?.filter(m => m.role === "user") || [],
          assistant: log.messages?.filter(m => m.role === "assistant") || [],
        };

        return (
          <div key={idx} className={cn("card-panel", colors.chip)} style={{ padding: 12, margin: 0 }}>
            <button
              onClick={() => toggleExpanded(idx)}
              className="flex items-center justify-between w-full"
              style={{ background: "none", border: "none", cursor: "pointer", width: "100%", padding: 0 }}
            >
              <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <MaterialIcon icon={isExpanded ? "ChevronDown" : "ChevronRight"} className="grey-text" style={{ fontSize: 16 }} />
                <span className={cn("chip", colors.chip)} style={{ height: 22, lineHeight: "22px", fontSize: 11 }}>
                  {log.agent}
                </span>
                <span className="grey-text" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Model: {log.model}
                </span>
                <span className="grey-text" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                  ({messageCount} msg{messageCount !== 1 ? 's' : ''})
                </span>
              </div>
            </button>

            {isExpanded && (
              <div style={{ marginTop: 12, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 12 }}>
                {log.messages && log.messages.length > 0 && (
                  <div className="flex flex-col" style={{ gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>Messages:</span>
                    {Object.entries(messagesByRole).map(([role, messages]) =>
                      messages.length > 0 ? (
                        <div key={role} className="flex flex-col" style={{ gap: 4 }}>
                          <div className="flex items-center gap-2">
                            <span className={cn("chip", getRoleBadgeStyle(role))} style={{ height: 20, lineHeight: "20px", fontSize: 10 }}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>
                            <span className="grey-text" style={{ fontSize: 11 }}>({messages.length})</span>
                          </div>
                          {messages.map((msg, msgIdx) => (
                            <div key={msgIdx} style={{
                              marginLeft: 12, padding: 8, background: "rgba(255,255,255,0.5)",
                              borderRadius: 4, fontSize: 11, border: "1px solid rgba(0,0,0,0.05)"
                            }}>
                              <p className="line-clamp-3" style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {truncateContent(msg.content, 200)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                )}

                {log.responsePreview && (
                  <div style={{ marginTop: 8, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 8 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>Response Preview:</span>
                      <button
                        onClick={() => toggleShowPreviewFull(idx)}
                        className="btn-flat"
                        style={{ padding: 2, minWidth: 24, height: 24, lineHeight: "24px" }}
                      >
                        <MaterialIcon icon={showFullPreview ? "EyeOff" : "Eye"} style={{ fontSize: 12 }} />
                      </button>
                    </div>
                    <div style={{
                      padding: 8, background: "rgba(255,255,255,0.5)", borderRadius: 4,
                      fontSize: 11, border: "1px solid rgba(0,0,0,0.05)", maxHeight: 128, overflowY: "auto"
                    }}>
                      <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {showFullPreview ? log.responsePreview : truncateContent(log.responsePreview, 300)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2" style={{ marginTop: 8, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 8 }}>
                  {onViewFullMessages && (
                    <button
                      onClick={() => onViewFullMessages(log)}
                      className="btn-flat btn-small"
                      style={{ fontSize: 11 }}
                    >
                      View Full Messages
                    </button>
                  )}
                  {log.responsePreview && (
                    <button
                      onClick={() => navigator.clipboard.writeText(log.responsePreview || "")}
                      className="btn-flat btn-small"
                      style={{ fontSize: 11 }}
                    >
                      <MaterialIcon icon="Copy" style={{ fontSize: 12, marginRight: 4 }} />
                      Copy
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
