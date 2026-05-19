import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantColors: Record<string, string> = {
    default: "badge blue",
    secondary: "badge grey",
    destructive: "badge red",
    outline: "badge",
  };
  return <span className={cn(variantColors[variant] || "badge", className)} {...props}>{children}</span>;
}

export { Badge };
