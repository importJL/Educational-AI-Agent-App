import * as React from "react";
import { cn } from "@/lib/utils";

// recharts is still used - this component is a pass-through
function Chart({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function ChartContainer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function ChartTooltip({ children }: { children?: React.ReactNode; content?: React.ReactNode }) {
  return <>{children}</>;
}

function ChartTooltipContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function ChartLegend({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function ChartLegendContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} {...props} />;
}

export { Chart, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
