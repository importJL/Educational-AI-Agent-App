import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Agent icon colors
const getAgentColor = (agent: string) => {
  const colors: Record<string, { bg: string; text: string; badge: string }> = {
    orchestrator: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-100 dark:bg-blue-900" },
    textual: { bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 dark:bg-purple-900" },
    rerouting: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300", badge: "bg-green-100 dark:bg-green-900" },
    ocr: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300", badge: "bg-amber-100 dark:bg-amber-900" },
  };
  return colors[agent] || { bg: "bg-gray-50 dark:bg-gray-950", text: "text-gray-700 dark:text-gray-300", badge: "bg-gray-100 dark:bg-gray-900" };
};

// Truncate long content
const truncateContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};

// Message role badge styling
const getRoleBadgeStyle = (role: string) => {
  const styles: Record<string, string> = {
    system: "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100",
    user: "bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100",
    assistant: "bg-purple-200 text-purple-900 dark:bg-purple-700 dark:text-purple-100",
  };
  return styles[role] || "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100";
};

export function AgentFlowViewer({ logs, onViewFullMessages }: AgentFlowViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<Set<number>>(new Set());
  const [showPreviewFull, setShowPreviewFull] = useState<Set<number>>(new Set());

  const toggleExpanded = (idx: number) => {
    const newSet = new Set(expandedIndex);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setExpandedIndex(newSet);
  };

  const toggleShowPreviewFull = (idx: number) => {
    const newSet = new Set(showPreviewFull);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setShowPreviewFull(newSet);
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {logs.map((log, idx) => {
          const isExpanded = expandedIndex.has(idx);
          const showFullPreview = showPreviewFull.has(idx);
          const colors = getAgentColor(log.agent);
          const messageCount = log.messages?.length || 0;

          // Group messages by role
          const messagesByRole = {
            system: log.messages?.filter(m => m.role === "system") || [],
            user: log.messages?.filter(m => m.role === "user") || [],
            assistant: log.messages?.filter(m => m.role === "assistant") || [],
          };

          return (
            <div key={idx} className={`rounded-lg border border-border p-3 transition-all ${colors.bg}`}>
              {/* Header */}
              <button
                onClick={() => toggleExpanded(idx)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                title={isExpanded ? "Collapse agent details" : "Expand agent details"}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className={`${colors.badge} ${colors.text} flex-shrink-0`}>
                      {log.agent}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">Model: {log.model}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">({messageCount} msg{messageCount !== 1 ? 's' : ''})</span>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  {/* Messages Summary */}
                  {log.messages && log.messages.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-foreground/70">Messages:</div>
                      <div className="space-y-2">
                        {Object.entries(messagesByRole).map(([role, messages]) =>
                          messages.length > 0 ? (
                            <div key={role} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getRoleBadgeStyle(role)} variant="secondary">
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">({messages.length})</span>
                              </div>
                              {messages.map((msg, msgIdx) => (
                                <div key={msgIdx} className="ml-3 p-2 bg-background/50 rounded text-xs border border-border/50">
                                  <p className="text-foreground/80 whitespace-pre-wrap break-words line-clamp-3">
                                    {truncateContent(msg.content, 200)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Response Preview */}
                  {log.responsePreview && (
                    <div className="space-y-2 border-t border-border pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground/70">Response Preview:</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleShowPreviewFull(idx)}
                              className="p-1 hover:bg-foreground/10 rounded transition-colors"                            aria-label={showFullPreview ? "Show truncated preview" : "Show full preview"}
                            title={showFullPreview ? "Show truncated preview" : "Show full preview"}                            >
                              {showFullPreview ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {showFullPreview ? "Show truncated" : "Show full"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="p-2 bg-background/50 rounded text-xs border border-border/50 max-h-32 overflow-y-auto">
                        <p className="text-foreground/80 whitespace-pre-wrap break-words">
                          {showFullPreview ? log.responsePreview : truncateContent(log.responsePreview, 300)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {onViewFullMessages && (
                      <button
                        onClick={() => onViewFullMessages(log)}
                        className="text-xs px-2 py-1 rounded bg-foreground/10 hover:bg-foreground/20 transition-colors text-foreground"
                        title="View full conversation messages"
                      >
                        View Full Messages
                      </button>
                    )}
                    {log.responsePreview && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(log.responsePreview || "");
                            }}
                            className="text-xs px-2 py-1 rounded bg-foreground/10 hover:bg-foreground/20 transition-colors text-foreground"
                            title="Copy response preview to clipboard"
                            aria-label="Copy response preview"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Copy response preview</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
