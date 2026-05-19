import * as React from "react";
import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("input-field", className)} {...props} />;
}

export { InputGroup };
