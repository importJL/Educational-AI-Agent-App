import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <div className="input-field">
      <textarea className={cn("materialize-textarea", className)} {...props} />
    </div>
  );
}

export { Textarea };
