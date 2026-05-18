import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
      // apply theme immediately if context supports it
      themeCtx.setTheme?.(theme as "light" | "dark");
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (prefsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-background">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Display Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Display
            </h3>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="theme"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Theme
                </Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="fontSize"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Font Size
                </Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger id="fontSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="pdfZoom"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Default PDF Zoom Level: {pdfZoomLevel}%
                </Label>
                <input
                  id="pdfZoom"
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={pdfZoomLevel}
                  onChange={e => setPdfZoomLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* General Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              General
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="autoSave"
                  type="checkbox"
                  checked={autoSaveResponses}
                  onChange={e => setAutoSaveResponses(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label
                  htmlFor="autoSave"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Automatically save task responses
                </Label>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={updatePrefsMutation.isPending}
            >
              {updatePrefsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
