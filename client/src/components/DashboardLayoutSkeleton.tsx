import { type CSSProperties } from "react";

export function DashboardLayoutSkeleton() {
  const skeletonBlock = (width: string = "100%", height: string = "16px") => (
    <div style={{
      width, height, borderRadius: 4,
      background: "linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    } as CSSProperties} />
  );

  return (
    <div className="flex" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ width: 280, borderRight: "1px solid #e0e0e0", background: "#fff", padding: 16, position: "relative" }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          {skeletonBlock("32px", "32px")}
          {skeletonBlock("96px", "16px")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {skeletonBlock("100%", "40px")}
          {skeletonBlock("100%", "40px")}
          {skeletonBlock("100%", "40px")}
        </div>
        <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
          <div className="flex items-center gap-3">
            {skeletonBlock("36px", "36px")}
            <div style={{ flex: 1 }}>
              {skeletonBlock("80px", "12px")}
              {skeletonBlock("128px", "8px")}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1" style={{ padding: 16 }}>
        {skeletonBlock("192px", "48px")}
        <div className="flex gap-4" style={{ marginTop: 16 }}>
          {skeletonBlock("33%", "128px")}
          {skeletonBlock("33%", "128px")}
          {skeletonBlock("33%", "128px")}
        </div>
        {skeletonBlock("100%", "256px")}
      </div>
    </div>
  );
}
