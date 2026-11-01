import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 18px",
        borderRadius: "10px",
        background: isSuccess ? "#f0fff4" : "#fff5f5",
        border: `1px solid ${isSuccess ? "#a5efbd" : "#fecaca"}`,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        color: isSuccess ? "#16803c" : "#b91c1c",
        fontSize: "13px",
        fontWeight: "700",
        maxWidth: "420px",
        animation: "slideInUp 0.25s ease-out",
      }}
      role="status"
      aria-live="polite"
    >
      {isSuccess ? <CheckCircle2 size={18} color="#16803c" /> : <AlertCircle size={18} color="#dc2626" />}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: isSuccess ? "#16803c" : "#b91c1c",
          display: "flex",
          alignItems: "center",
          padding: "2px",
        }}
        aria-label="Dismiss toast"
      >
        <X size={15} />
      </button>
    </div>
  );
}
