import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

function Tabs({ children, className }: TabsProps) {
  return <>{children}</>;
}

function TabsList({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("tabs", className)} {...props}>{children}</div>;
}

function TabsTrigger({ className, value, children, ...props }: React.ComponentPropsWithoutRef<"a"> & { value: string }) {
  return <a className={cn("tab", className)} href={`#${value}`} {...props}>{children}</a>;
}

function TabsContent({ className, value, children, ...props }: React.ComponentPropsWithoutRef<"div"> & { value: string }) {
  return <div id={value} className={cn("", className)} {...props}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
