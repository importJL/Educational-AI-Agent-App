import * as React from "react";
import { cn } from "@/lib/utils";

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return (
    <div
      className={cn("card-panel", variant === "destructive" ? "red lighten-4 red-text text-darken-2" : "blue lighten-4 blue-text text-darken-2", className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
