import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Drawer({ open, onOpenChange, children }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={() => onOpenChange?.(false)} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", width: "100%", maxWidth: 600,
        borderRadius: "16px 16px 0 0", maxHeight: "80vh", overflow: "auto",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.15)"
      }}>
        {children}
      </div>
    </div>
  );
}

function DrawerContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 className={cn("", className)} {...props} />;
}

function DrawerDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("grey-text", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function DrawerTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("", className)} {...props} />;
}

function DrawerClose({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn-flat", className)} {...props} />;
}

export { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger, DrawerClose };
