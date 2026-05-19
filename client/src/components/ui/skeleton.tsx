import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("skeleton", className)}
      style={{
        background: "linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: 4,
        minHeight: 16,
      }}
      {...props}
    />
  );
}

// Inject shimmer animation once
if (typeof document !== "undefined" && !document.getElementById("skeleton-style")) {
  const style = document.createElement("style");
  style.id = "skeleton-style";
  style.textContent = `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
  document.head.appendChild(style);
}

export { Skeleton };
