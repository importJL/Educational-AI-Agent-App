import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({ className, value, ...props }: React.ComponentProps<"div"> & { value?: number }) {
  return (
    <div className={cn("progress", className)} {...props}>
      <div className="determinate" style={{ width: `${value || 0}%` }} />
    </div>
  );
}

export { Progress };
