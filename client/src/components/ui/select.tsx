import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  placeholder?: string;
}

function Select({ value, onValueChange, children, placeholder }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value);
  };
  return (
    <div className="input-field">
      <select className="browser-default" value={value} onChange={handleChange}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
    </div>
  );
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function SelectContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function SelectItem({ className, value, children, ...props }: React.ComponentProps<"option"> & { value: string }) {
  return <option value={value} className={cn("", className)} {...props}>{children}</option>;
}

function SelectValue({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("", className)} {...props} />;
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
