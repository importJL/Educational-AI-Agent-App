import * as React from "react";
import { cn } from "@/lib/utils";

// For date picking, we use react-day-picker still - styled with Materialize colors
function Calendar({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

export { Calendar };
