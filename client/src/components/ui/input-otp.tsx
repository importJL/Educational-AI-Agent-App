import * as React from "react";
import { cn } from "@/lib/utils";

function InputOTP({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} style={{ gap: 8 }} {...props} />;
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} style={{ gap: 4 }} {...props} />;
}

function InputOTPSlot({ className, index, ...props }: React.ComponentProps<"input"> & { index: number }) {
  return (
    <input
      className={cn("", className)}
      style={{ width: 40, height: 48, textAlign: "center", fontSize: 18, border: "1px solid #ccc", borderRadius: 4 }}
      maxLength={1}
      {...props}
    />
  );
}

function InputOTPSeparator() {
  return <span style={{ display: "flex", alignItems: "center" }}>-</span>;
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
