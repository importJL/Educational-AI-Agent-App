import { useAuth } from "@/_core/hooks/useAuth";
import { MaterialIcon } from "@/components/MaterialIcon";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';

const menuItems = [
  { icon: "LayoutDashboard", label: "Page 1", path: "/" },
  { icon: "Users", label: "Page 2", path: "/some-path" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f5f5f5" }}>
        <div className="flex flex-col items-center gap-4" style={{ padding: 32, maxWidth: 400, textAlign: "center" }}>
          <h5 style={{ fontWeight: 600 }}>Sign in to continue</h5>
          <p className="grey-text">Access to this dashboard requires authentication.</p>
          <button
            className="btn waves-effect waves-light"
            onClick={() => window.location.href = getLoginUrl()}
            style={{ width: "100%", marginTop: 8 }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const sidebarStyle = {
    width: sidebarCollapsed ? 64 : sidebarWidth,
    transition: "width 0.2s",
    overflow: "hidden",
    borderRight: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column" as const,
    background: "#fff",
    position: "relative" as const,
  };

  return (
    <div className="flex" style={{ height: "100vh", background: "#f5f5f5" }}>
      <div style={sidebarStyle}>
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 12px", borderBottom: "1px solid #e0e0e0" }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-flat"
            style={{ padding: 8, minWidth: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcon icon="PanelLeft" />
          </button>
          {!sidebarCollapsed && (
            <span style={{ fontWeight: 600, marginLeft: 8, whiteSpace: "nowrap" }}>Navigation</span>
          )}
        </div>

        <div className="flex-1" style={{ padding: "4px 8px" }}>
          {menuItems.map(item => {
            const isActive = window.location.pathname === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className="waves-effect"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                  textDecoration: "none", color: "inherit",
                  background: isActive ? "rgba(21,101,192,0.1)" : "transparent",
                }}
                onClick={e => { e.preventDefault(); window.history.pushState({}, "", item.path); }}
              >
                <MaterialIcon icon={item.icon} className={isActive ? "blue-text" : "grey-text"} />
                {!sidebarCollapsed && <span style={{ fontSize: 14, whiteSpace: "nowrap" }}>{item.label}</span>}
              </a>
            );
          })}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid #e0e0e0" }}>
          <div className="flex items-center gap-3" style={{ padding: "4px 8px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#1565c0", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 500, flexShrink: 0
            }}>
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.name || "-"}
                </p>
                <p style={{ fontSize: 11, color: "#888", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email || "-"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="absolute top-0 right-0"
          style={{ width: 4, height: "100%", cursor: "col-resize", zIndex: 50 }}
          onMouseDown={() => {
            if (sidebarCollapsed) return;
            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = e.clientX - (document.querySelector('[class*="sidebar"]') as HTMLElement)?.getBoundingClientRect().left || 0;
              if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
            };
            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
      </div>

      <main className="flex-1 overflow-auto" style={{ padding: 16 }}>
        {children}
      </main>
    </div>
  );
}
