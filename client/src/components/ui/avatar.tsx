import * as React from "react";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("avatar", className)} style={{ borderRadius: "50%", overflow: "hidden", width: 40, height: 40 }} {...props} />;
}

function AvatarImage({ className, ...props }: React.ComponentProps<"img">) {
  return <img className={cn("", className)} style={{ width: "100%", height: "100%", objectFit: "cover" }} {...props} />;
}

function AvatarFallback({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} style={{
    width: "100%", height: "100%", display: "flex",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#1565c0", color: "#fff", fontWeight: 500
  }} {...props}>{children}</div>;
}

export { Avatar, AvatarImage, AvatarFallback };
