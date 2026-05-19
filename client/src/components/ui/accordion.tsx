import * as React from "react";
import { cn } from "@/lib/utils";

function Accordion({ className, children, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return <ul className={cn("collapsible", className)} {...props}>{children}</ul>;
}

function AccordionItem({ className, children, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return <li className={cn("", className)} {...props}>{children}</li>;
}

function AccordionTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("collapsible-header", className)} {...props}>{children}</div>;
}

function AccordionContent({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("collapsible-body", className)} {...props}>{children}</div>;
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
