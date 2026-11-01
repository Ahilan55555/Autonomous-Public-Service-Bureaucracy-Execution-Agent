import { useState, useEffect } from "react";
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  FolderCheck,
  FileCheck2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { servicesApi } from "../api/services";
import { CANONICAL_CATEGORIES, getCategoryDisplayLabel } from "../api/normalize";
import Toast from "./Toast";

export default function ServicesList({ onCheckEligibility, onCheckReadiness, onCreateDraft }) {
  const [services, setServices] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;
    servicesApi
      .getServices(activeCategory)
      .then((data) => {
        if (!ignore) {
          setServices(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load discovered schemes.");
        }
      });

    function onSchemeDeleted(e) {
      const deletedId = e.detail?.serviceId;
      if (deletedId) {
        setServices((prev) => (prev ? prev.filter((s) => s.id !== deletedId) : prev));
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("civic_user_scheme_deleted", onSchemeDeleted);
    }

    return () => {
      ignore = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("civic_user_scheme_deleted", onSchemeDeleted);
      }
    };
  }, [activeCategory]);

  const isLoading = (services === null && !error) || isRetrying;

  async function handleCategorySelect(catId) {
    if (activeCategory === catId) return;
    setActiveCategory(catId);
    setServices(null);
    setError(null);
  }

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);
    try {
      const data = await servicesApi.getServices(activeCategory);
      setServices(data);
    } catch (err) {
      setError(err.message || "Failed to load discovered schemes.");
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleDelete(serviceId, serviceName) {
    if (deletingId) return;
    setDeletingId(serviceId);
    try {
      await servicesApi.deleteUserScheme(serviceId);
      // Immediately remove card from state
      setServices((prev) => (prev ? prev.filter((s) => s.id !== serviceId) : []));
      setToast({
        message: `"${serviceName || "Scheme"}" removed from your discovered schemes.`,
        type: "success",
      });
    } catch (err) {
      setToast({
        message: err.message || "Failed to dismiss scheme. Please try again.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section id="Explore Services" style={{ marginBottom: "35px" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
          Discovered Schemes & Services
        </h2>
        <p style={{ fontSize: "13px", color: "#777", margin: "6px 0 0" }}>
          Schemes discovered for your profile across central and state departments
        </p>
      </div>

      {/* Canonical Category Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "20px",
          scrollbarWidth: "none",
        }}
      >
        {CANONICAL_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: isActive ? "#367c4b" : "#e5e7e5",
                background: isActive ? "#c7ffd8" : "#fff",
                color: isActive ? "#16803c" : "#555",
                fontSize: "12px",
                fontWeight: "750",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
          <RefreshCw size={24} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: "13px", color: "#666" }}>Loading your discovered schemes...</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="auth-error" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                background: "transparent",
                border: "none",
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

      {!isLoading && !error && services && services.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
          <FileText size={32} color="#999" style={{ margin: "0 auto 10px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px" }}>No Schemes Found</h3>
          <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
            {activeCategory !== "all"
              ? `No schemes discovered under ${getCategoryDisplayLabel(activeCategory)} yet.`
              : "No schemes currently discovered. Use the AI Assistant or Search & Discovery to find schemes."}
          </p>
        </div>
      )}

      {!isLoading && services && services.length > 0 && (
        <div className="dashboard-grid">
          {services.map((service) => (
            <div
              key={service.id || service.service_code}
              className="dashboard-card"
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      background: "#e8fff0",
                      color: "#16803c",
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    {service.category_display || getCategoryDisplayLabel(service.category)}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {service.portal_url && (
                      <a
                        href={service.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Official Portal"
                        style={{ color: "#777", display: "inline-flex", alignItems: "center" }}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === service.id}
                      onClick={() => handleDelete(service.id, service.name)}
                      title="Dismiss from your discovered schemes"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#999",
                        cursor: deletingId === service.id ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px",
                        opacity: deletingId === service.id ? 0.4 : 1,
                      }}
                    >
                      {deletingId === service.id ? (
                        <RefreshCw size={14} className="spin-animation" color="#dc2626" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "0 0 8px" }}>
                  {service.name}
                </h3>

                <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.6", margin: "0 0 14px" }}>
                  {service.description || "No description provided."}
                </p>

                {/* Capabilities tags */}
                {service.capabilities && service.capabilities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                    {service.capabilities.map((cap, cIdx) => (
                      <span
                        key={`${cap}-${cIdx}`}
                        style={{
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: "#f0f4ff",
                          color: "#2563eb",
                          fontSize: "10px",
                          fontWeight: "700",
                        }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                )}

                {service.required_documents && service.required_documents.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#888", marginBottom: "6px" }}>
                      REQUIRED DOCUMENTS:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {service.required_documents.map((doc, idx) => (
                        <span
                          key={`${doc}-${idx}`}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "#f3f5f3",
                            color: "#444",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  paddingTop: "14px",
                  borderTop: "1px solid #e5e7e5",
                }}
              >
                <button
                  type="button"
                  onClick={() => onCheckEligibility(service.id, service.name)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #c7ffd8",
                    background: "#e8fff0",
                    color: "#16803c",
                    fontSize: "11px",
                    fontWeight: "750",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <ShieldCheck size={13} />
                  Eligibility
                </button>

                <button
                  type="button"
                  onClick={() => onCheckReadiness(service.id, service.name)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    background: "#fff",
                    color: "#333",
                    fontSize: "11px",
                    fontWeight: "750",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <FolderCheck size={13} />
                  Readiness
                </button>

                <button
                  type="button"
                  onClick={() => onCreateDraft(service.id, service.name)}
                  style={{
                    gridColumn: "span 2",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#111",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <FileCheck2 size={14} />
                  Execution Draft Manifest
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
