import * as React from "react";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("pagination", className)} {...props} />;
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("pagination", className)} {...props} />;
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("waves-effect", className)} {...props} />;
}

function PaginationLink({ className, href, ...props }: React.ComponentProps<"a">) {
  return <a href={href || "#!"} className={cn("", className)} {...props} />;
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("disabled", className)} {...props}><a href="#!"><i className="material-icons">chevron_left</i></a></li>;
}

function PaginationNext({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("waves-effect", className)} {...props}><a href="#!"><i className="material-icons">chevron_right</i></a></li>;
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props}>...</li>;
}

export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis };
