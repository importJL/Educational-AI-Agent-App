import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be within SidebarProvider");
  return ctx;
}

function SidebarProvider({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [state, setState] = React.useState<"expanded" | "collapsed">("expanded");
  const toggleSidebar = () => setState(prev => prev === "expanded" ? "collapsed" : "expanded");
  return (
    <SidebarContext.Provider value={{ state, toggleSidebar }}>
      <div className="flex" style={{ height: "100%", ...style }}>{children}</div>
    </SidebarContext.Provider>
  );
}

function Sidebar({ className, children, ...props }: React.ComponentProps<"div">) {
  const { state } = useSidebar();
  return (
    <div
      className={cn("sidenav-fixed", className)}
      style={{
        width: state === "collapsed" ? 64 : "var(--sidebar-width, 280px)",
        transition: "width 0.2s",
        overflow: "hidden",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

function SidebarMenuButton({ className, isActive, tooltip, children, ...props }: React.ComponentProps<"a"> & { isActive?: boolean; tooltip?: string }) {
  return (
    <a
      className={cn("waves-effect", isActive ? "blue lighten-5" : "", className)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
        borderRadius: 8, cursor: "pointer", textDecoration: "none",
        backgroundColor: isActive ? "rgba(21,101,192,0.1)" : "transparent",
      }}
      {...props}
    >
      {children}
    </a>
  );
}

function SidebarInset({ className, children, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("flex-1 overflow-auto", className)} {...props}>{children}</main>;
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();
  return <button className={cn("btn-flat", className)} onClick={toggleSidebar} {...props}>
    <i className="material-icons">menu</i>
  </button>;
}

export { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, useSidebar };
