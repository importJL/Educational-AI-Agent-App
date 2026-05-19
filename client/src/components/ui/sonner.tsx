import { useRef } from "react";

interface ToasterProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

function Toaster({ position = "top-right" }: ToasterProps) {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} id="toast-container" style={{
    position: "fixed", zIndex: 10000,
    top: position.includes("top") ? 16 : undefined,
    bottom: position.includes("bottom") ? 16 : undefined,
    right: position.includes("right") ? 16 : undefined,
    left: position.includes("left") ? 16 : undefined,
  }} />;
}

export { Toaster };
