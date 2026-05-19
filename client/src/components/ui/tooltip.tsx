import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children?: React.ReactNode;
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

function TooltipTrigger({ className, asChild, children, ...props }: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const Comp = asChild ? "span" : "span";
  return <Comp className={cn("tooltipped", className)} data-tooltip={props.title || ""} {...props}>{children}</Comp>;
}

function TooltipContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
