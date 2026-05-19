import * as React from "react";
import { cn } from "@/lib/utils";

function Collapsible({ className, children, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return <ul className={cn("collapsible", className)} {...props}>{children}</ul>;
}

function CollapsibleTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("collapsible-header", className)} {...props}>{children}</div>;
}

function CollapsibleContent({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("collapsible-body", className)} {...props}>{children}</div>;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
