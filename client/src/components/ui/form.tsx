import * as React from "react";
import { cn } from "@/lib/utils";

function Form({ className, ...props }: React.ComponentProps<"form">) {
  return <form className={cn("", className)} {...props} />;
}

export { Form };
