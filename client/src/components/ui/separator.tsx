import * as React from "react";
import { cn } from "@/lib/utils";

function Separator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("divider", className)} {...props} />;
}

export { Separator };
