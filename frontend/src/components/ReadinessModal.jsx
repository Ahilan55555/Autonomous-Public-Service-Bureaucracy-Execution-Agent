import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, RefreshCw, FolderCheck, Upload } from "lucide-react";
import { documentsApi } from "../api/services";

export default function ReadinessModal({ serviceId, serviceName, isOpen, onClose, onNavigateVault }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (isOpen && serviceId) {
      documentsApi
        .checkReadiness(serviceId)
        .then((res) => {
          if (!ignore) {
            setData(res);
            setError(null);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err.message || "Failed to check document readiness.");
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, serviceId]);

  if (!isOpen) return null;

  const isLoading = (!data && !error) || isRetrying;

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);
    try {
      const res = await documentsApi.checkReadiness(serviceId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to check document readiness.");
    } finally {
      setIsRetrying(false);
    }
  }

  function handleClose() {
    setData(null);
    setError(null);
    onClose();
  }

  return (
    <div className="civic-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="civic-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="civic-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="civic-modal-icon">
              <FolderCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Document Readiness Check</h3>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#666" }}>
                {serviceName || data?.service_name || "Government Service"}
              </p>
            </div>
          </div>
          <button className="civic-modal-close" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="civic-modal-body">
          {isLoading && (
            <div style={{ padding: "35px", textAlign: "center" }}>
              <RefreshCw size={26} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: "14px", fontWeight: "750" }}>Analyzing document vault...</div>
              <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                Matching uploaded files against scheme requirements
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="auth-error" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{error}</span>
                <button
                  type="button"
                  onClick={handleRetry}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#dc2626",
                    fontWeight: "700",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {data && !isLoading && (
            <div>
              {/* Readiness Percentage & Progress Bar */}
              <div
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  background: data.is_ready_for_execution ? "#f0fff4" : "#fffbeb",
                  border: `1px solid ${data.is_ready_for_execution ? "#a5efbd" : "#fde68a"}`,
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: data.is_ready_for_execution ? "#245834" : "#92400e" }}>
                    {data.is_ready_for_execution ? "All Documents Ready for Dispatch" : "Incomplete Document Vault"}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "800" }}>{data.readiness_percentage}%</div>
                </div>

                {/* Clamped Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    borderRadius: "5px",
                    background: "#e5e7e5",
                    overflow: "hidden",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: `${data.readiness_percentage}%`,
                      height: "100%",
                      background: data.is_ready_for_execution ? "#367c4b" : "#f59e0b",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <div style={{ fontSize: "12px", color: "#666" }}>
                  Available: <b>{data.available_count}</b> of <b>{data.total_required_count}</b> required documents
                </div>
              </div>

              {/* Satisfied Documents List */}
              <div style={{ marginBottom: "18px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#245834", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={16} color="#367c4b" />
                  Satisfied Documents ({data.satisfied_documents.length})
                </h4>
                {data.satisfied_documents.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#333", lineHeight: "1.7" }}>
                    {data.satisfied_documents.map((doc, idx) => (
                      <li key={`${doc}-${idx}`}>{doc}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: "12px", color: "#777", fontStyle: "italic" }}>
                    None satisfied yet.
                  </div>
                )}
              </div>

              {/* Missing Documents List */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#b91c1c", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={16} color="#dc2626" />
                  Missing Documents ({data.missing_documents.length})
                </h4>
                {data.missing_documents.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#b91c1c", lineHeight: "1.7" }}>
                    {data.missing_documents.map((doc, idx) => (
                      <li key={`${doc}-${idx}`}>{doc}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: "12px", color: "#367c4b", fontWeight: "600" }}>
                    No missing documents!
                  </div>
                )}
              </div>

              {/* Vault shortcut */}
              {data.missing_documents.length > 0 && onNavigateVault && (
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onNavigateVault();
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "#111",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "700",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={16} />
                    Go to Document Vault to Upload Missing Documents
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="civic-modal-footer">
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "10px 18px",
              background: "#f4f7f4",
              color: "#333",
              border: "1px solid #ddd",
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
