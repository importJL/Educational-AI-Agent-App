import { useEffect, useState } from "react";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) setInternalOpen(open);
  }, [open, onOpenChange]);

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    else setInternalOpen(false);
    onClose?.();
  };

  const isOpen = onOpenChange ? open : internalOpen;
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#f8f8f7", borderRadius: 20, width: 400, maxWidth: "90vw",
        padding: "32px 20px 20px",
        boxShadow: "0 4px 11px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.08)",
        textAlign: "center"
      }}>
        <div className="flex flex-col items-center gap-2" style={{ padding: "0 20px" }}>
          {logo && (
            <div style={{
              width: 64, height: 64, background: "#fff", borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 8
            }}>
              <img src={logo} alt="" style={{ width: 40, height: 40, borderRadius: 8 }} />
            </div>
          )}
          {title && <h5 style={{ fontWeight: 600, color: "#34322d", margin: 0 }}>{title}</h5>}
          <p style={{ fontSize: 14, color: "#858481", margin: 0 }}>
            Please login with Manus to continue
          </p>
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          <button
            onClick={onLogin}
            className="btn waves-effect waves-light"
            style={{
              width: "100%", height: 40, background: "#1a1a19", borderRadius: 10,
              fontSize: 14, fontWeight: 500, lineHeight: "40px", padding: 0
            }}
          >
            Login with Manus
          </button>
        </div>
      </div>
    </div>
  );
}
