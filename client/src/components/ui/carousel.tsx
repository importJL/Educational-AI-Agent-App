import * as React from "react";
import { cn } from "@/lib/utils";

function Carousel({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current && typeof (window as any).M !== "undefined") {
      const instance = (window as any).M.Carousel.init(ref.current);
      return () => instance.destroy();
    }
  }, []);
  return <div ref={ref} className={cn("carousel", className)} {...props}>{children}</div>;
}

function CarouselContent({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("carousel-item", className)} {...props} />;
}

function CarouselItem({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("carousel-item", className)} {...props} />;
}

function CarouselPrevious({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  return <button className={cn("btn-flat", className)} {...props}><i className="material-icons">chevron_left</i></button>;
}

function CarouselNext({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  return <button className={cn("btn-flat", className)} {...props}><i className="material-icons">chevron_right</i></button>;
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
