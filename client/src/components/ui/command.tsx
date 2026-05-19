import * as React from "react";
import { cn } from "@/lib/utils";

function Command({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function CommandInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="input-field">
      <input className={cn("", className)} {...props} />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("collection", className)} {...props} />;
}

function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("collection-item", className)} {...props} />;
}

function CommandGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function CommandItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("collection-item", className)} style={{ cursor: "pointer" }} {...props} />;
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
