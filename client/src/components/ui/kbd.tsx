import * as React from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn("", className)}
      style={{
        padding: "2px 6px", fontSize: 11, borderRadius: 3,
        border: "1px solid #ccc", backgroundColor: "#f7f7f7",
        fontFamily: "monospace"
      }}
      {...props}
    />
  );
}

export { Kbd };
