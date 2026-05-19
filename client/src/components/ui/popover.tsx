import * as React from "react";
import { cn } from "@/lib/utils";

function Popover({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function PopoverTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("", className)} {...props}>{children}</button>;
}

function PopoverContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("", className)}
      style={{
        position: "absolute", zIndex: 1000, background: "#fff",
        borderRadius: 4, boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        padding: 8, minWidth: 160
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
