import * as React from "react";
import { cn } from "@/lib/utils";

function RadioGroup({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function RadioGroupItem({ className, id, ...props }: React.ComponentProps<"input">) {
  return (
    <label>
      <input type="radio" className={cn("with-gap", className)} id={id} {...props} />
      <span>{props.placeholder || ""}</span>
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
