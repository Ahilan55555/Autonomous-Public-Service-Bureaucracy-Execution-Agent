import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, X, Wifi } from "lucide-react";
import { getApiBaseUrl, setApiBaseUrlOverride, clearApiBaseUrlOverride } from "../api/config";
import { healthApi } from "../api/services";

export default function BackendStatusModal({ isOpen, onClose }) {
  const [overrideVersion, setOverrideVersion] = useState(0);
  const activeUrl = getApiBaseUrl();
  const [inputUrl, setInputUrl] = useState(activeUrl);
  const [healthStatus, setHealthStatus] = useState({ state: "checking", data: null, error: null });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (isOpen) {
      healthApi
        .checkHealth()
        .then((res) => {
          if (!ignore) {
            setHealthStatus({ state: "online", data: res, error: null });
          }
        })
        .catch((err) => {
          if (!ignore) {
            setHealthStatus({
              state: "offline",
              data: null,
              error: err.message || "Failed to reach backend server.",
            });
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, overrideVersion]);

  if (!isOpen) return null;

  async function handleManualTest() {
    setIsTesting(true);
    setHealthStatus({ state: "checking", data: null, error: null });
    try {
      const res = await healthApi.checkHealth();
      setHealthStatus({ state: "online", data: res, error: null });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("civic_api_base_url_changed"));
      }
    } catch (err) {
      setHealthStatus({
        state: "offline",
        data: null,
        error: err.message || "Failed to reach backend server.",
      });
    } finally {
      setIsTesting(false);
    }
  }

  function handleSaveUrl(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputUrl.trim()) {
      clearApiBaseUrlOverride();
    } else {
      setApiBaseUrlOverride(inputUrl.trim());
    }
    setOverrideVersion((v) => v + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("civic_api_base_url_changed"));
    }
    handleManualTest();
  }

  function handleSelectPreset(presetUrl) {
    setInputUrl(presetUrl);
    setApiBaseUrlOverride(presetUrl);
    setOverrideVersion((v) => v + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("civic_api_base_url_changed"));
    }
    handleManualTest();
  }

  function handleReset() {
    clearApiBaseUrlOverride();
    setInputUrl(getApiBaseUrl());
    setOverrideVersion((v) => v + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("civic_api_base_url_changed"));
    }
    handleManualTest();
  }

  return (
    <div className="civic-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="civic-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="civic-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="civic-modal-icon">
              <Wifi size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Backend Server & LAN Configuration</h3>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#666" }}>
                Multi-machine development and health monitor
              </p>
            </div>
          </div>
          <button className="civic-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="civic-modal-body">
          {/* Health Status Card */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background:
                healthStatus.state === "online"
                  ? "#f0fff4"
                  : healthStatus.state === "checking"
                  ? "#f8f9fa"
                  : "#fff5f5",
              border: `1px solid ${
                healthStatus.state === "online"
                  ? "#a5efbd"
                  : healthStatus.state === "checking"
                  ? "#e5e7e5"
                  : "#fecaca"
              }`,
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {healthStatus.state === "online" ? (
                  <CheckCircle2 size={22} color="#367c4b" />
                ) : healthStatus.state === "checking" ? (
                  <RefreshCw size={22} className="spin-animation" color="#737373" />
                ) : (
                  <AlertCircle size={22} color="#dc2626" />
                )}
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>
                    {healthStatus.state === "online"
                      ? "Backend Server Connected"
                      : healthStatus.state === "checking"
                      ? "Testing Connection..."
                      : "Backend Server Unreachable"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    Target: <code style={{ fontWeight: "600" }}>{activeUrl}</code>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualTest}
                disabled={isTesting}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: isTesting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={13} className={isTesting ? "spin-animation" : ""} />
                Test Health
              </button>
            </div>

            {healthStatus.state === "online" && healthStatus.data && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #c7ffd8", fontSize: "12px" }}>
                <span>
                  Service: <b>{healthStatus.data.service}</b>
                </span>{" "}
                &bull;{" "}
                <span>
                  Database: <b>{healthStatus.data.database}</b>
                </span>{" "}
                &bull;{" "}
                <span>
                  Status: <b>{healthStatus.data.status}</b>
                </span>
              </div>
            )}

            {healthStatus.state === "offline" && healthStatus.error && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#dc2626" }}>
                {healthStatus.error}
              </div>
            )}
          </div>

          {/* Presets */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#555" }}>
              Quick Presets:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleSelectPreset("https://hunter-splashy-qualify.ngrok-free.dev")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: activeUrl.includes("ngrok") ? "2px solid #367c4b" : "1px solid #ddd",
                  background: activeUrl.includes("ngrok") ? "#f0fff4" : "#fdfdfd",
                  color: activeUrl.includes("ngrok") ? "#235a34" : "#333",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                🌐 Ngrok Tunnel (Live)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("http://localhost:8000")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: activeUrl.includes("localhost") ? "2px solid #367c4b" : "1px solid #ddd",
                  background: activeUrl.includes("localhost") ? "#f0fff4" : "#fdfdfd",
                  color: activeUrl.includes("localhost") ? "#235a34" : "#333",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                💻 Localhost (8000)
              </button>
            </div>
          </div>

          {/* Change Target Backend URL */}
          <form onSubmit={handleSaveUrl}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
              Custom Backend Base URL
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://hunter-splashy-qualify.ngrok-free.dev or http://192.168.1.100:8000"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "13px",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 18px",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Apply URL
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "none",
                color: "#367c4b",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "0",
              }}
            >
              Reset to .env default ({import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"})
            </button>
          </form>

          {/* Guidelines */}
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "10px",
              background: "#f7f9f7",
              border: "1px solid #e5e7e5",
              fontSize: "12px",
              lineHeight: "1.6",
              color: "#444",
            }}
          >
            <div style={{ fontWeight: "700", marginBottom: "6px", color: "#111" }}>
              Separate Machine Setup Tips:
            </div>
            <ul style={{ margin: "0", paddingLeft: "18px" }}>
              <li>
                <b>Backend computer:</b> Start with{" "}
                <code>uvicorn app.main:app --host 0.0.0.0 --port 8000</code>
              </li>
              <li>
                <b>Backend LAN IP:</b> Run <code>ip addr</code> (Linux) or <code>ipconfig</code> (Windows).
              </li>
              <li>
                <b>Frontend computer:</b> Set URL to <code>http://&lt;BACKEND_LAN_IP&gt;:8000</code>.
              </li>
              <li>Ensure firewall on backend machine permits inbound TCP traffic on port 8000.</li>
            </ul>
          </div>
        </div>

        <div className="civic-modal-footer">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
