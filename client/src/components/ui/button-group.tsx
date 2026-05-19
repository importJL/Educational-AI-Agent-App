import * as React from "react";
import { cn } from "@/lib/utils";

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} style={{ gap: 4 }} {...props} />;
}

export { ButtonGroup };
