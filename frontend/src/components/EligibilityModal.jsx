import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, X, RefreshCw, ShieldCheck, FileText, AlertCircle } from "lucide-react";
import { eligibilityApi } from "../api/services";

export default function EligibilityModal({ serviceId, serviceName, isOpen, onClose, onNavigateProfile }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (isOpen && serviceId) {
      eligibilityApi
        .checkEligibility(serviceId)
        .then((res) => {
          if (!ignore) {
            setData(res);
            setError(null);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err.message || "Failed to evaluate scheme eligibility.");
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
      const res = await eligibilityApi.checkEligibility(serviceId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to evaluate scheme eligibility.");
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
      <div className="civic-modal-card civic-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="civic-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="civic-modal-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>
                Eligibility Check
              </h3>
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
            <div style={{ padding: "40px", textAlign: "center" }}>
              <RefreshCw size={28} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "14px", fontWeight: "700" }}>Evaluating citizen eligibility criteria...</div>
              <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                Comparing your profile against scheme requirements
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
              {/* Overall Eligibility Status Banner */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: data.is_eligible ? "#f0fff4" : "#fff5f5",
                  border: `1px solid ${data.is_eligible ? "#a5efbd" : "#fecaca"}`,
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {data.is_eligible ? (
                    <CheckCircle2 size={26} color="#367c4b" />
                  ) : (
                    <XCircle size={26} color="#dc2626" />
                  )}
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: data.is_eligible ? "#245834" : "#b91c1c" }}>
                      {data.is_eligible ? "Eligible for this Scheme" : "Currently Ineligible"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
                      Service Code: <code style={{ fontWeight: "700" }}>{data.service_code || serviceId}</code>
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "800",
                    background: data.is_eligible ? "#c7ffd8" : "#fee2e2",
                    color: data.is_eligible ? "#255a35" : "#b91c1c",
                  }}
                >
                  {data.is_eligible ? "PASSED" : "FAILED"}
                </span>
              </div>

              {/* Next Action Instructions */}
              {data.next_action_instructions && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "#f7f9f7",
                    border: "1px solid #e5e7e5",
                    fontSize: "13px",
                    color: "#333",
                    marginBottom: "20px",
                    lineHeight: "1.6",
                  }}
                >
                  <div style={{ fontWeight: "700", marginBottom: "4px", color: "#111" }}>Next Action Instructions:</div>
                  <div>{data.next_action_instructions}</div>
                </div>
              )}

              {/* Missing Profile Data Notice */}
              {data.missing_profile_data && data.missing_profile_data.length > 0 && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <AlertCircle size={18} color="#b45309" style={{ marginTop: "2px" }} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e" }}>
                        Missing Profile Information:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                        {data.missing_profile_data.map((f) => (
                          <span
                            key={f}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "#fef3c7",
                              color: "#78350f",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {onNavigateProfile && (
                    <button
                      type="button"
                      onClick={onNavigateProfile}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "#111",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "700",
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Complete Profile
                    </button>
                  )}
                </div>
              )}

              {/* Criteria Breakdown Table */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>
                  Criteria Evaluation Breakdown
                </h4>
                {data.evaluation_breakdown && data.evaluation_breakdown.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table className="civic-table">
                      <thead>
                        <tr>
                          <th>Criterion</th>
                          <th>Requirement</th>
                          <th>Citizen Actual</th>
                          <th>Result</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.evaluation_breakdown.map((item, idx) => (
                          <tr key={`${item.criterion}-${idx}`}>
                            <td style={{ fontWeight: "700" }}>{item.criterion}</td>
                            <td>{item.required}</td>
                            <td>{item.actual}</td>
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: item.passed ? "#e8fff0" : "#fee2e2",
                                  color: item.passed ? "#16803c" : "#b91c1c",
                                }}
                              >
                                {item.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                {item.passed ? "Passed" : "Failed"}
                              </span>
                            </td>
                            <td style={{ fontSize: "12px", color: "#666" }}>{item.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "#777", fontStyle: "italic", padding: "10px 0" }}>
                    No specific breakdown criteria specified for this scheme.
                  </div>
                )}
              </div>

              {/* Required Documents to Prepare */}
              {data.required_documents_to_prepare && data.required_documents_to_prepare.length > 0 && (
                <div style={{ marginTop: "15px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "8px" }}>
                    Required Documents to Prepare
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {data.required_documents_to_prepare.map((doc) => (
                      <span
                        key={doc}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#e8f8ed",
                          color: "#286b3e",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        <FileText size={13} />
                        {doc}
                      </span>
                    ))}
                  </div>
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
