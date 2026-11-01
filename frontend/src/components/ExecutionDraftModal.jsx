import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  FileText,
  Upload,
  UserCheck,
  Send,
} from "lucide-react";
import { executionApi, applicationsApi } from "../api/services";

export default function ExecutionDraftModal({
  serviceId,
  serviceName,
  isOpen,
  onClose,
  onNavigateProfile,
  onNavigateVault,
}) {
  const navigate = useNavigate();
  const [citizenQuery, setCitizenQuery] = useState("");
  const [fieldEntries, setFieldEntries] = useState([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [manifest, setManifest] = useState(null);
  const [dispatchedApp, setDispatchedApp] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  function handleAddField() {
    setFieldEntries((prev) => [...prev, { key: "", value: "" }]);
  }

  function handleRemoveField(index) {
    setFieldEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFieldChange(index, field, val) {
    setFieldEntries((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  }

  function handleClose() {
    setManifest(null);
    setDispatchedApp(null);
    setDispatching(false);
    setError(null);
    setCitizenQuery("");
    setFieldEntries([{ key: "", value: "" }]);
    onClose();
  }

  async function handleDispatchApplication() {
    if (!manifest) return;
    setDispatching(true);
    setError(null);
    try {
      const app = await applicationsApi.dispatchApplication(manifest);
      setDispatchedApp(app);
    } catch (e) {
      setError(e.message || "Failed to record dispatched application.");
    } finally {
      setDispatching(false);
    }
  }

  async function handleGenerate(e) {
    if (e) e.preventDefault();
    if (!serviceId) return;

    setLoading(true);
    setError(null);

    const additionalFields = {};
    fieldEntries.forEach((entry) => {
      if (entry.key && entry.key.trim()) {
        additionalFields[entry.key.trim()] = entry.value;
      }
    });

    try {
      const res = await executionApi.createDraft(serviceId, citizenQuery, additionalFields);
      setManifest(res);

      // If backend returned missing_form_fields, ensure inputs for them exist
      if (res.missing_form_fields && res.missing_form_fields.length > 0) {
        setFieldEntries((prev) => {
          const currentKeys = new Set(prev.map((item) => item.key.trim().toLowerCase()));
          const newEntries = [...prev];
          res.missing_form_fields.forEach((missingKey) => {
            if (!currentKeys.has(missingKey.trim().toLowerCase())) {
              newEntries.push({ key: missingKey, value: "" });
            }
          });
          return newEntries.filter((item) => item.key || item.value);
        });
      }
    } catch (err) {
      setError(err.message || "Failed to generate execution draft manifest.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="civic-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="civic-modal-card civic-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="civic-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="civic-modal-icon">
              <FileCheck2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Execution Draft Manifest</h3>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#666" }}>
                Pre-validation and review for: {serviceName || manifest?.service_name || "Scheme"}
              </p>
            </div>
          </div>
          <button className="civic-modal-close" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="civic-modal-body">
          {error && <div className="auth-error" style={{ marginBottom: "16px" }}>{error}</div>}

          {/* Form inputs for generating draft */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "#f9faf9",
              border: "1px solid #e5e7e5",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "12px" }}>
              Draft Generation Parameters
            </h4>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                Citizen Query / Grievance Statement (Optional)
              </label>
              <textarea
                rows={2}
                value={citizenQuery}
                onChange={(e) => setCitizenQuery(e.target.value)}
                placeholder="Enter details of your request or grievance..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "13px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>
                  Additional Form Fields (Optional / Service-Specific)
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#367c4b",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>

              {fieldEntries.map((field, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    placeholder="Field name (e.g. landmark)"
                    value={field.key}
                    onChange={(e) => handleFieldChange(idx, "key", e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "12px" }}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Near bus stand)"
                    value={field.value}
                    onChange={(e) => handleFieldChange(idx, "value", e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "12px" }}
                  />
                  {fieldEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      style={{
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: "0 8px",
                        cursor: "pointer",
                        color: "#888",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "750",
                fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  Generating Pre-validated Draft Manifest...
                </>
              ) : (
                <>
                  <FileCheck2 size={16} />
                  Validate & Generate Execution Manifest
                </>
              )}
            </button>
          </div>

          {/* Manifest Response Display */}
          {manifest && (
            <div>
              {/* Ready for Dispatch Banner */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: manifest.ready_for_dispatch ? "#f0fff4" : "#fff5f5",
                  border: `1px solid ${manifest.ready_for_dispatch ? "#a5efbd" : "#fecaca"}`,
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {manifest.ready_for_dispatch ? (
                      <CheckCircle2 size={24} color="#367c4b" />
                    ) : (
                      <AlertTriangle size={24} color="#dc2626" />
                    )}
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "800", color: manifest.ready_for_dispatch ? "#245834" : "#b91c1c" }}>
                        {manifest.ready_for_dispatch
                          ? "Execution Manifest Ready for Dispatch"
                          : "Action Required Before Dispatch"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                        Governance Tier: <b>{manifest.governance_tier}</b> &bull; Service: <b>{manifest.service_code || manifest.service_name}</b>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "800",
                      background: manifest.ready_for_dispatch ? "#c7ffd8" : "#fee2e2",
                      color: manifest.ready_for_dispatch ? "#255a35" : "#b91c1c",
                    }}
                  >
                    {manifest.ready_for_dispatch ? "DISPATCH READY" : "PENDING DATA"}
                  </span>
                </div>

                {!manifest.ready_for_dispatch && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #fecaca", fontSize: "12px", color: "#666" }}>
                    Government portals require all mandatory form fields and satisfied documents before dispatch.
                  </div>
                )}
              </div>

              {/* Missing Fields and Missing Documents warnings */}
              {manifest.missing_form_fields.length > 0 && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    marginBottom: "14px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ fontWeight: "700", color: "#92400e" }}>
                      Missing Form Fields:
                    </div>
                    {onNavigateProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          onNavigateProfile();
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#92400e",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <UserCheck size={12} /> Check Citizen Profile
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {manifest.missing_form_fields.map((f) => (
                      <span key={f} style={{ padding: "2px 8px", borderRadius: "6px", background: "#fef3c7", color: "#78350f", fontWeight: "700" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: "6px", color: "#78350f" }}>
                    Fill these in the Additional Fields section above and click Generate again.
                  </div>
                </div>
              )}

              {manifest.missing_documents.length > 0 && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "700", color: "#b91c1c", marginBottom: "4px" }}>
                      Missing Documents in Vault:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {manifest.missing_documents.map((d) => (
                        <span key={d} style={{ padding: "2px 8px", borderRadius: "6px", background: "#fee2e2", color: "#991b1b", fontWeight: "700" }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  {onNavigateVault && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onNavigateVault();
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Upload size={12} />
                      Upload to Vault
                    </button>
                  )}
                </div>
              )}

              {/* Dynamic Form Payload Table */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>
                  Validated Application Form Payload
                </h4>
                {manifest.form_payload && Object.keys(manifest.form_payload).length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table className="civic-table">
                      <thead>
                        <tr>
                          <th style={{ width: "35%" }}>Field Name</th>
                          <th>Field Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(manifest.form_payload).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ fontWeight: "700", color: "#444" }}>{k}</td>
                            <td>
                              {v === null || v === undefined
                                ? "-"
                                : typeof v === "object"
                                ? JSON.stringify(v)
                                : String(v)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#777", fontStyle: "italic" }}>
                    No form payload generated yet.
                  </div>
                )}
              </div>

              {/* File Attachments */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>
                  Attached Documents ({manifest.file_attachments.length})
                </h4>
                {manifest.file_attachments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {manifest.file_attachments.map((att, idx) => (
                      <div
                        key={`${att.filename}-${idx}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#fff",
                          border: "1px solid #e5e7e5",
                          fontSize: "13px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={18} color="#367c4b" />
                          <div>
                            <div style={{ fontWeight: "700" }}>{att.filename}</div>
                            <div style={{ fontSize: "11px", color: "#777" }}>Requirement: {att.requirement}</div>
                          </div>
                        </div>

                        {att.download_url && (
                          <a
                            href={att.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "#f0f5f1",
                              color: "#286b3e",
                              fontSize: "12px",
                              fontWeight: "700",
                              textDecoration: "none",
                            }}
                          >
                            <Download size={13} />
                            Verify Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#777", fontStyle: "italic" }}>
                    No files attached.
                  </div>
                )}
              </div>

              {/* Dispatch Action Button */}
              {manifest.ready_for_dispatch && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: dispatchedApp ? "#e8fff0" : "#f0fdf4",
                    border: `1px solid ${dispatchedApp ? "#86efac" : "#bbf7d0"}`,
                    marginTop: "20px",
                  }}
                >
                  {dispatchedApp ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: "800", fontSize: "14px" }}>
                        <CheckCircle2 size={18} color="#16a34a" /> Application Genuinely Dispatched & Recorded!
                      </div>
                      <p style={{ fontSize: "13px", color: "#15803d", margin: "6px 0 12px" }}>
                        Reference ID: <strong>{dispatchedApp.reference_number}</strong> &bull; Status: <strong>{dispatchedApp.status}</strong>
                      </p>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => {
                            handleClose();
                            navigate("/my-applications");
                          }}
                          style={{
                            padding: "9px 16px",
                            borderRadius: "8px",
                            background: "#166534",
                            color: "#fff",
                            border: "none",
                            fontWeight: "750",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          View in My Applications
                        </button>
                        {manifest.portal_url && (
                          <a
                            href={manifest.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "9px 16px",
                              borderRadius: "8px",
                              background: "#111",
                              color: "#fff",
                              fontWeight: "750",
                              fontSize: "12px",
                              textDecoration: "none",
                            }}
                          >
                            Open Government Portal <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#16803c" }}>
                          Manifest Ready for Government Portal Dispatch
                        </div>
                        <div style={{ fontSize: "12px", color: "#367c4b", marginTop: "2px" }}>
                          Target: {manifest.portal_url || "Public Service Gateway"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleDispatchApplication}
                          disabled={dispatching}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "11px 18px",
                            borderRadius: "8px",
                            background: "#166534",
                            color: "#fff",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: "800",
                            cursor: dispatching ? "not-allowed" : "pointer",
                          }}
                        >
                          {dispatching ? (
                            <>
                              <RefreshCw size={14} className="spin-animation" />
                              Dispatching Application...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              Confirm & Dispatch Application
                            </>
                          )}
                        </button>
                        {manifest.portal_url && (
                          <a
                            href={manifest.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "11px 18px",
                              borderRadius: "8px",
                              background: "#111",
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: "800",
                              textDecoration: "none",
                            }}
                          >
                            Open Portal <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
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
