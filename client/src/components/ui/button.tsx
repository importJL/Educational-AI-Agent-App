import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "flat" | "outline" | "danger" | "link" | "secondary" | "destructive" | "ghost";
type ButtonSize = "default" | "small" | "large" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantToMaterialize: Record<string, string> = {
  default: "btn",
  flat: "btn-flat",
  outline: "btn-outline",
  danger: "btn red",
  link: "btn-flat",
  secondary: "btn btn-secondary",
  destructive: "btn red",
  ghost: "btn-flat",
};

const sizeToMaterialize: Record<string, string> = {
  default: "",
  small: "btn-small",
  large: "btn-large",
  sm: "btn-small",
  lg: "btn-large",
  icon: "btn-floating",
};

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const btnClass = variantToMaterialize[variant] || "btn";
  const sizeClass = sizeToMaterialize[size] || "";
  return <button className={cn(btnClass, sizeClass, className)} {...props} />;
}

export { Button };
