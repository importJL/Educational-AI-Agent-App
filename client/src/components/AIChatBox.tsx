import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
};

export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "60vh",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayMessages = messages.filter(msg => msg.role !== "system");

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      requestAnimationFrame(() => {
        scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    onSendMessage(trimmedInput);
    setInput("");
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("card", className)}
      style={{ display: "flex", flexDirection: "column", maxHeight: height, margin: 0 }}
    >
      {/* Messages Area */}
      <div
        ref={scrollAreaRef}
        className="overflow-auto"
        style={{ flex: 1, padding: 16 }}
      >
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: "100%", textAlign: "center", color: "#888" }}>
            <MaterialIcon icon="Sparkles" style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>{emptyStateMessage}</p>
            {suggestedPrompts && suggestedPrompts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 400 }}>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => onSendMessage(prompt)}
                    disabled={isLoading}
                    className="btn-flat"
                    style={{ border: "1px solid #e0e0e0", fontSize: 13, padding: "6px 12px", borderRadius: 8 }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 16 }}>
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className="flex gap-3"
                style={{
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start"
                }}
              >
                {message.role === "assistant" && (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(21,101,192,0.1)", display: "flex",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    <MaterialIcon icon="Sparkles" style={{ fontSize: 16, color: "#1565c0" }} />
                  </div>
                )}

                <div style={{
                  maxWidth: message.role === "user" ? "80%" : "100%",
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: message.role === "user" ? "#1565c0" : "#f0f0f0",
                  color: message.role === "user" ? "#fff" : "inherit",
                  overflowY: "auto",
                }}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm" style={{ maxWidth: "none" }}>
                      <Streamdown>{message.content}</Streamdown>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{message.content}</p>
                  )}
                </div>

                {message.role === "user" && (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "#e0e0e0", display: "flex",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    <MaterialIcon icon="User" style={{ fontSize: 16 }} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(21,101,192,0.1)", display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>
                  <MaterialIcon icon="Sparkles" style={{ fontSize: 16, color: "#1565c0" }} />
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 12, padding: "10px 16px" }}>
                  <div className="preloader-wrapper small active" style={{ width: 20, height: 20 }}>
                    <div className="spinner-layer spinner-blue-only">
                      <div className="circle-clipper left"><div className="circle" /></div>
                      <div className="gap-patch"><div className="circle" /></div>
                      <div className="circle-clipper right"><div className="circle" /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-end"
        style={{ padding: 16, borderTop: "1px solid #e0e0e0", background: "#fafafa" }}
      >
        <div className="input-field" style={{ flex: 1, margin: 0 }}>
          <textarea
            ref={textareaRef}
            className="materialize-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            style={{ minHeight: 36, maxHeight: 128, resize: "none", margin: 0 }}
          />
        </div>
        <button
          type="submit"
          className="btn waves-effect waves-light"
          disabled={!input.trim() || isLoading}
          style={{ height: 38, width: 38, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          {isLoading ? (
            <div className="preloader-wrapper small active" style={{ width: 16, height: 16 }}>
              <div className="spinner-layer spinner-white-only">
                <div className="circle-clipper left"><div className="circle" /></div>
                <div className="gap-patch"><div className="circle" /></div>
                <div className="circle-clipper right"><div className="circle" /></div>
              </div>
            </div>
          ) : (
            <MaterialIcon icon="Send" style={{ fontSize: 16 }} />
          )}
        </button>
      </form>
    </div>
  );
}
