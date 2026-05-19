import * as React from "react";
import { cn } from "@/lib/utils";

function Menubar({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} style={{ gap: 4 }} {...props} />;
}

function MenubarMenu({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn-flat", className)} {...props} />;
}

function MenubarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function MenubarItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("collection-item", className)} {...props} />;
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("divider", className)} {...props} />;
}

function MenubarLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function MenubarShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("grey-text", className)} {...props} />;
}

export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarLabel, MenubarShortcut };
