import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={() => onOpenChange?.(false)} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", justifyContent: "flex-end"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", width: 400, maxWidth: "90vw",
        height: "100%", overflow: "auto", boxShadow: "-4px 0 16px rgba(0,0,0,0.15)"
      }}>
        {children}
      </div>
    </div>
  );
}

function SheetContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 className={cn("", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("grey-text", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function SheetTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("", className)} {...props} />;
}

function SheetClose({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn-flat", className)} {...props} />;
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose };
