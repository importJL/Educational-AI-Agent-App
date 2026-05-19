import * as React from "react";
import { cn } from "@/lib/utils";

function Slider({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className={cn("range-field", className)}>
      <input type="range" {...props} />
    </div>
  );
}

export { Slider };
