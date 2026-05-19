import * as React from "react";
import { cn } from "@/lib/utils";

function Item({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("collection-item", className)} {...props} />;
}

export { Item };
