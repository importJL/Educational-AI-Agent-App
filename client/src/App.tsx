import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { MaterialIcon } from "./components/MaterialIcon";
import { trpc } from "@/lib/trpc";
import Login from "./pages/Login";
import DocumentViewer from "./pages/DocumentViewer";
import Saves from "./pages/Saves";
import Settings from "./pages/Settings";

type TabType = "Document Viewer" | "Saves" | "Settings";

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>("Document Viewer");
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f5f5f5" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="preloader-wrapper small active">
            <div className="spinner-layer spinner-blue-only">
              <div className="circle-clipper left"><div className="circle" /></div>
              <div className="gap-patch"><div className="circle" /></div>
              <div className="circle-clipper right"><div className="circle" /></div>
            </div>
          </div>
          <p className="grey-text">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "#f5f5f5" }}>
      {/* Navigation Bar */}
      <nav>
        <div className="nav-wrapper" style={{ padding: "0 16px" }}>
          <div className="flex items-center justify-between" style={{ height: 64 }}>
            <div className="flex items-center gap-2">
              <span className="brand-logo" style={{ position: "static" }}>
                Educational AI Agent
              </span>
            </div>
            <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleTheme?.()}
                  className="btn-flat"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    background: "transparent",
                    fontWeight: 400,
                    padding: "0 16px",
                    height: 36,
                    borderRadius: 4,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcon icon={theme === "dark" ? "Sun" : "Moon"} style={{ fontSize: 18, height: 18, width: 18, display: "flex", alignItems: "center", justifyContent: "center" }} />
              </button>
              {(["Document Viewer", "Saves", "Settings"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="btn-flat"
                  style={{
                    color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.7)",
                    background: activeTab === tab ? "rgba(255,255,255,0.15)" : "transparent",
                    fontWeight: activeTab === tab ? 600 : 400,
                    padding: "0 16px", height: 36, borderRadius: 4, fontSize: 14
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === "Document Viewer" ? "h-full" : "hidden h-full"}>
          <DocumentViewer />
        </div>
        <div className={activeTab === "Saves" ? "h-full" : "hidden h-full"}>
          <Saves />
        </div>
        <div className={activeTab === "Settings" ? "h-full" : "hidden h-full"}>
          <Settings />
        </div>
      </div>
    </div>
  );
}

function App() {
  const prefsQuery = trpc.preferences.get.useQuery();

  if (prefsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f5f5f5" }}>
        <div className="preloader-wrapper small active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left"><div className="circle" /></div>
            <div className="gap-patch"><div className="circle" /></div>
            <div className="circle-clipper right"><div className="circle" /></div>
          </div>
        </div>
      </div>
    );
  }

  const defaultTheme = (prefsQuery.data?.theme || "light") as "light" | "dark";

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme={defaultTheme} switchable={true}>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
