import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({ className, id, ...props }: React.ComponentProps<"input">) {
  return (
    <label>
      <input type="checkbox" className={cn("filled-in", className)} id={id} {...props} />
      <span>{props.placeholder || ""}</span>
    </label>
  );
}

export { Checkbox };
