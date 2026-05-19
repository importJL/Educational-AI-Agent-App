import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={() => onOpenChange?.(false)} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 8, padding: 24, maxWidth: 400, width: "90%",
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)"
      }}>
        {children}
      </div>
    </div>
  );
}

function AlertDialogContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 className={cn("", className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("grey-text", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} style={{ justifyContent: "flex-end", gap: 8, marginTop: 16 }} {...props} />;
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn", className)} {...props} />;
}

function AlertDialogCancel({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn-flat", className)} {...props} />;
}

export { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel };
