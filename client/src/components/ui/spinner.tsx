import * as React from "react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("preloader-wrapper small active", className)} {...props}>
      <div className="spinner-layer spinner-blue-only">
        <div className="circle-clipper left"><div className="circle" /></div>
        <div className="gap-patch"><div className="circle" /></div>
        <div className="circle-clipper right"><div className="circle" /></div>
      </div>
    </div>
  );
}

export { Spinner };
