import * as React from "react";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className={cn("switch", className)}>
      <label>
        <input type="checkbox" {...props} />
        <span className="lever"></span>
      </label>
    </div>
  );
}

export { Switch };
