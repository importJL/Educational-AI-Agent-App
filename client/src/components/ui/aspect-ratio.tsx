import * as React from "react";

function AspectRatio({ ratio = 16 / 9, children, ...props }: { ratio?: number; children?: React.ReactNode } & React.ComponentProps<"div">) {
  return (
    <div style={{ position: "relative", width: "100%", paddingBottom: `${(1 / ratio) * 100}%` }} {...props}>
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}

export { AspectRatio };
