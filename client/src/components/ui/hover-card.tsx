import * as React from "react";
import { cn } from "@/lib/utils";

function HoverCard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function HoverCardTrigger({ className, children, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("tooltipped", className)} data-tooltip={props.title || ""} {...props}>{children}</span>;
}

function HoverCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
