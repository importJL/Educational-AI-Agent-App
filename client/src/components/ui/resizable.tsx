import * as React from "react";
import { cn } from "@/lib/utils";

function ResizablePanelGroup({ className, direction = "horizontal", children, ...props }: React.ComponentProps<"div"> & { direction?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn("resizable-panel-group", className)}
      data-direction={direction}
      style={{ flexDirection: direction === "horizontal" ? "row" : "column" }}
      {...props}
    >
      {children}
    </div>
  );
}

function ResizablePanel({ className, defaultSize, minSize, maxSize, children, ...props }: React.ComponentProps<"div"> & { defaultSize?: number; minSize?: number; maxSize?: number }) {
  const [size, setSize] = React.useState(defaultSize || 50);
  return (
    <div
      className={cn("", className)}
      style={{ flex: `${size} 1 0%`, overflow: "auto", minWidth: minSize || 0 }}
      {...props}
    >
      {children}
    </div>
  );
}

function ResizableHandle({ className, withHandle, ...props }: React.ComponentProps<"div"> & { withHandle?: boolean }) {
  return (
    <div
      className={cn("resizable-handle", className)}
      style={{
        width: 4, cursor: "col-resize", background: "#e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}
      {...props}
    >
      {withHandle && <div style={{ width: 16, height: 24, background: "#ccc", borderRadius: 4 }} />}
    </div>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
