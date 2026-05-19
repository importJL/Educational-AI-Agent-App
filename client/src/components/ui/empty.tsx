import * as React from "react";
import { cn } from "@/lib/utils";

function Empty({ className, icon, title, description, ...props }: React.ComponentProps<"div"> & { icon?: string; title?: string; description?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)} style={{ padding: 32, textAlign: "center", color: "#888" }} {...props}>
      {icon && <i className="material-icons" style={{ fontSize: 48, marginBottom: 16 }}>{icon}</i>}
      {title && <h5 style={{ margin: "0 0 8px", color: "#666" }}>{title}</h5>}
      {description && <p style={{ margin: 0, color: "#999" }}>{description}</p>}
    </div>
  );
}

export { Empty };
