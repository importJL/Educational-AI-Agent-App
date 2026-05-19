import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children?: React.ReactNode;
}

function DropdownMenu({ children }: DropdownMenuProps) {
  return <div className="dropdown-wrapper" style={{ position: "relative", display: "inline-block" }}>{children}</div>;
}

function DropdownMenuTrigger({ className, asChild, children, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? "span" : "button";
  return <Comp className={cn("dropdown-trigger", className)} {...props}>{children}</Comp>;
}

function DropdownMenuContent({ className, children, align = "center", ...props }: React.ComponentProps<"div"> & { align?: "start" | "center" | "end" }) {
  const alignStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    marginTop: 4,
    zIndex: 1000,
    minWidth: 160,
    background: "#fff",
    borderRadius: 4,
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    ...(align === "start" ? { left: 0 } : align === "end" ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" })
  };
  return <div className={cn("", className)} style={alignStyle} {...props}>
    <ul className="collection" style={{ margin: 0, border: "none" }}>
      {children}
    </ul>
  </div>;
}

function DropdownMenuItem({ className, children, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("collection-item", className)} style={{ cursor: "pointer", padding: "8px 16px" }} {...props}>{children}</li>;
}

function DropdownMenuLabel({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grey-text", className)} style={{ padding: "8px 16px", fontSize: 12 }} {...props}>{children}</div>;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <li><div className={cn("divider", className)} {...props} /></li>;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator };
