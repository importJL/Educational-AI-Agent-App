import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="input-field">
      <input type={type || "text"} className={cn("", className)} {...props} />
    </div>
  );
}

export { Input };
