import * as React from "react";
import { cn } from "@/lib/utils";

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("input-field", className)} {...props} />;
}

export { Field };
