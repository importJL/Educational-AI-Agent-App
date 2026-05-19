import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <>
      <div className="modal-overlay" onClick={() => onOpenChange?.(false)} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "#fff", borderRadius: 8, maxWidth: 600, width: "90%",
          maxHeight: "90vh", overflow: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.2)"
        }}>
          {children}
        </div>
      </div>
    </>
  );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("modal-content", className)} {...props}>{children}</div>;
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("modal-header", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <h4 className={cn("", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("grey-text", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("modal-footer", className)} {...props} />;
}

function DialogTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<"button">) {
  return <button className={cn("btn", className)} {...props}>{children}</button>;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger };
