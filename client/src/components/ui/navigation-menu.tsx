import * as React from "react";
import { cn } from "@/lib/utils";

function NavigationMenu({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav className={cn("", className)} {...props} />;
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex", className)} {...props} />;
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

function NavigationMenuLink({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={cn("", className)} {...props} />;
}

function NavigationMenuTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("btn-flat", className)} {...props} />;
}

function NavigationMenuContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function NavigationMenuIndicator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function NavigationMenuViewport({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuViewport };
