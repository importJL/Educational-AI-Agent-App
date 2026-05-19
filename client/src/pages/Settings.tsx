import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const prefsQuery = trpc.preferences.get.useQuery();
  const updatePrefsMutation = trpc.preferences.update.useMutation();
  const themeCtx = useTheme();

  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [pdfZoomLevel, setPdfZoomLevel] = useState(100);
  const [autoSaveResponses, setAutoSaveResponses] = useState(true);

  useEffect(() => {
    if (prefsQuery.data) {
      setTheme(prefsQuery.data.theme || "light");
      setFontSize(prefsQuery.data.fontSize || "medium");
      setPdfZoomLevel(prefsQuery.data.pdfZoomLevel || 100);
      setAutoSaveResponses((prefsQuery.data.autoSaveResponses || 1) === 1);
    }
  }, [prefsQuery.data]);

  const handleSave = async () => {
    try {
      await updatePrefsMutation.mutateAsync({
        theme: theme as "light" | "dark",
        fontSize: fontSize as "small" | "medium" | "large",
        pdfZoomLevel,
        autoSaveResponses: autoSaveResponses ? 1 : 0,
      });
      themeCtx.setTheme?.(theme as "light" | "dark");
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (prefsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
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

  return (
    <div className="overflow-y-auto" style={{ height: "100%", padding: 16, background: "#f5f5f5" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <h4 style={{ fontWeight: 700, marginBottom: 24 }}>Settings</h4>

        {/* Display Settings */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-content">
            <span className="card-title">Display</span>

            <div className="flex items-center" style={{ marginBottom: 20 }}>
              <label style={{ width: 160, fontWeight: 500 }}>Theme</label>
              <div className="input-field" style={{ flex: 1, margin: 0 }}>
                <select
                  className="browser-default"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  style={{ display: "block" }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            <div className="flex items-center" style={{ marginBottom: 20 }}>
              <label style={{ width: 160, fontWeight: 500 }}>Font Size</label>
              <div className="input-field" style={{ flex: 1, margin: 0 }}>
                <select
                  className="browser-default"
                  value={fontSize}
                  onChange={e => setFontSize(e.target.value)}
                  style={{ display: "block" }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 500, display: "block", marginBottom: 8 }}>
                Default PDF Zoom Level: {pdfZoomLevel}%
              </label>
              <div className="range-field">
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={pdfZoomLevel}
                  onChange={e => setPdfZoomLevel(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-content">
            <span className="card-title">General</span>
            <label>
              <input
                type="checkbox"
                className="filled-in"
                checked={autoSaveResponses}
                onChange={e => setAutoSaveResponses(e.target.checked)}
              />
              <span>Automatically save task responses</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          className="btn waves-effect waves-light"
          onClick={handleSave}
          disabled={updatePrefsMutation.isPending}
        >
          {updatePrefsMutation.isPending ? (
            <>
              <div className="preloader-wrapper small active" style={{ width: 20, height: 20, display: "inline-block", marginRight: 8, verticalAlign: "middle" }}>
                <div className="spinner-layer spinner-white-only">
                  <div className="circle-clipper left"><div className="circle" /></div>
                  <div className="gap-patch"><div className="circle" /></div>
                  <div className="circle-clipper right"><div className="circle" /></div>
                </div>
              </div>
              Saving...
            </>
          ) : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
