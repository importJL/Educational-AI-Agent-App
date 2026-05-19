import * as React from "react";
import { cn } from "@/lib/utils";

function Toggle({ className, pressed, onPressedChange, ...props }: React.ComponentProps<"button"> & { pressed?: boolean; onPressedChange?: (pressed: boolean) => void }) {
  return (
    <button
      className={cn("btn-flat", pressed ? "blue lighten-4" : "", className)}
      onClick={() => onPressedChange?.(!pressed)}
      {...props}
    />
  );
}

export { Toggle };
