import * as React from "react";
import { cn } from "@/lib/utils";

function ToggleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} style={{ gap: 2 }} {...props} />;
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn-flat", className)} {...props} />;
}

export { ToggleGroup, ToggleGroupItem };
