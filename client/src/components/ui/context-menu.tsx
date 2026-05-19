import * as React from "react";
import { cn } from "@/lib/utils";

function ContextMenu({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function ContextMenuTrigger({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function ContextMenuContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function ContextMenuItem({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem };
