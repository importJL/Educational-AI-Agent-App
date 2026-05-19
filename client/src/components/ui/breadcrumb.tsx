import * as React from "react";
import { cn } from "@/lib/utils";

function Breadcrumb({ className, children, ...props }: React.ComponentProps<"nav">) {
  return <nav className={cn("", className)} {...props}>
    <div className="nav-wrapper" style={{ paddingLeft: 16 }}>
      <div className="col s12">
        {children}
      </div>
    </div>
  </nav>;
}

function BreadcrumbItem({ className, children, href, ...props }: React.ComponentProps<"a">) {
  return <a href={href || "#!"} className={cn("breadcrumb", className)} {...props}>{children}</a>;
}

function BreadcrumbSeparator() {
  return null;
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("", className)} {...props}>...</span>;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("breadcrumb", className)} {...props} />;
}

function BreadcrumbLink({ className, children, href, ...props }: React.ComponentProps<"a">) {
  return <a href={href || "#!"} className={cn("breadcrumb", className)} {...props}>{children}</a>;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbEllipsis, BreadcrumbPage, BreadcrumbLink, BreadcrumbList };
