import { useState, useRef } from "react";
import {
  Search,
  Compass,
  ShieldCheck,
  FolderCheck,
  FileCheck2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { discoveryApi, servicesApi } from "../api/services";
import { getCategoryDisplayLabel } from "../api/normalize";
import Toast from "./Toast";

export default function ServiceDiscovery({ userState = "", onCheckEligibility, onCheckReadiness, onCreateDraft }) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState(userState);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const searchSeqRef = useRef(0);

  const states = [
    "",
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry"
  ];

  async function handleSearch(e) {
    if (e) e.preventDefault();

    if (!query.trim() || query.trim().length < 3) {
      setError("Please enter at least 3 characters to search.");
      return;
    }

    const currentSeq = ++searchSeqRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await discoveryApi.search(query, stateFilter);
      // Discard stale responses if a newer search was initiated
      if (currentSeq === searchSeqRef.current) {
        setResults(data);
      }
    } catch (err) {
      if (currentSeq === searchSeqRef.current) {
        setError(err.message || "Failed to discover services.");
        setResults(null);
      }
    } finally {
      if (currentSeq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  }

  async function handleDelete(serviceId, serviceName) {
    if (deletingId) return;
    setDeletingId(serviceId);
    try {
      await servicesApi.deleteUserScheme(serviceId);
      setResults((prev) => (prev ? prev.filter((s) => s.id !== serviceId) : []));
      setToast({
        message: `"${serviceName || "Scheme"}" dismissed from your discovered list.`,
        type: "success",
      });
    } catch (err) {
      setToast({
        message: err.message || "Failed to dismiss scheme.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section id="Dynamic Discovery" style={{ marginBottom: "35px" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>
          Dynamic Service Discovery
        </h2>
        <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
          Search for schemes, subsidies, and government programs by keyword and state jurisdiction
        </p>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={handleSearch}
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "14px",
          border: "1px solid #e5e7e5",
          marginBottom: "20px",
        }}
      >
        <div className="discovery-search-grid">
          <div style={{ position: "relative" }}>
            <Search size={18} color="#777" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Search scheme name, category, or benefit (min. 3 chars)..."
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: "9px",
                border: "1px solid #ddd",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "9px",
              border: "1px solid #ddd",
              fontSize: "13px",
              background: "#fff",
              outline: "none",
            }}
          >
            <option value="">All States / All India</option>
            {states.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              fontWeight: "750",
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {loading ? <RefreshCw size={15} className="spin-animation" /> : <Search size={15} />}
            Search
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </form>

      {/* Results View */}
      {results !== null && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#555", marginBottom: "14px" }}>
            Found {results.length} matching {results.length === 1 ? "scheme" : "schemes"}
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
              <Compass size={32} color="#999" style={{ margin: "0 auto 10px" }} />
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 6px" }}>No Schemes Found</h3>
              <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
                Try different keywords or select "All States" to discover broader central schemes.
              </p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {results.map((service) => (
                <div
                  key={service.id || service.service_code}
                  className="dashboard-card"
                  style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
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
                            title="Portal link"
                            style={{ color: "#777" }}
                          >
                            <ExternalLink size={15} />
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
                            <RefreshCw size={13} className="spin-animation" color="#dc2626" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 8px" }}>
                      {service.name}
                    </h3>

                    <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.6", margin: "0 0 14px" }}>
                      {service.description}
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
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      paddingTop: "12px",
                      borderTop: "1px solid #e5e7e5",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onCheckEligibility(service.id, service.name)}
                      style={{
                        padding: "7px 10px",
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
                        gap: "4px",
                      }}
                    >
                      <ShieldCheck size={12} />
                      Eligibility
                    </button>

                    <button
                      type="button"
                      onClick={() => onCheckReadiness(service.id, service.name)}
                      style={{
                        padding: "7px 10px",
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
                        gap: "4px",
                      }}
                    >
                      <FolderCheck size={12} />
                      Readiness
                    </button>

                    <button
                      type="button"
                      onClick={() => onCreateDraft(service.id, service.name)}
                      style={{
                        gridColumn: "span 2",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#111",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "750",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      <FileCheck2 size={13} />
                      Execution Draft Manifest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
