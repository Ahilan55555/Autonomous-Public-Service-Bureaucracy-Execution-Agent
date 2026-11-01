import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  UserRound,
  LogOut,
  Menu,
  X,
  FileText,
  ClipboardList,
  FolderCheck,
  Search,
  Bell,
  Wifi,
  ExternalLink,
  Download,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Building2,
  Trash2,
} from "lucide-react";

import { healthApi, applicationsApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import "../App.css";

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 850 : true));
  const [profile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("citizenProfile") || "{}");
    } catch {
      return {};
    }
  });

  const userName = profile.full_name || localStorage.getItem("user_name") || "Citizen";
  const [backendOnline, setBackendOnline] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Applications state
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  async function loadApplications() {
    setIsLoading(true);
    try {
      const data = await applicationsApi.getApplications();
      setApplications(data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    healthApi.checkHealth().then((res) => {
      if (isMounted) {
        setBackendOnline(res.status === "ok");
      }
    });

    applicationsApi
      .getApplications()
      .then((data) => {
        if (isMounted) {
          setApplications(data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load applications:", err);
          setIsLoading(false);
        }
      });

    function onDispatched() {
      applicationsApi.getApplications().then((data) => {
        if (isMounted) {
          setApplications(data || []);
        }
      });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("civic_application_dispatched", onDispatched);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("civic_application_dispatched", onDispatched);
      }
    };
  }, []);

  async function handleDelete(appId) {
    await applicationsApi.deleteApplication(appId);
    setShowDeleteConfirm(null);
    if (selectedApp?.id === appId) setSelectedApp(null);
    await loadApplications();
  }

  function downloadManifestJson(app) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${app.reference_number || "application"}_manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("citizenProfile");
    navigate("/login");
  }

  const filteredApps = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const totalCount = applications.length;
  const processingCount = applications.filter((a) => a.status?.toLowerCase() === "processing").length;
  const approvedCount = applications.filter((a) => a.status?.toLowerCase() === "approved").length;
  const submittedCount = applications.filter((a) => a.status?.toLowerCase() === "submitted" || a.status?.toLowerCase() === "pending").length;

  return (
    <div className="dashboard">
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="sidebar-brand-icon">
              <ShieldCheck size={22} />
            </div>
            CivicEase
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/home"
            className="sidebar-link"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </NavLink>

          <NavLink
            to="/schemes-catalog"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <FileText size={19} />
            Schemes Catalog
          </NavLink>

          <NavLink
            to="/search-discovery"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <Search size={19} />
            Search & Discovery
          </NavLink>

          <NavLink
            to="/document-vault"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <FolderCheck size={19} />
            Document Vault
          </NavLink>

          <NavLink
            to="/my-applications"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <ClipboardList size={19} />
            My Applications
          </NavLink>
        </nav>

        <p
          style={{
            fontSize: "10px",
            fontWeight: "800",
            color: "#999",
            letterSpacing: "1px",
            margin: "25px 0 10px 10px",
          }}
        >
          ACCOUNT
        </p>

        <nav className="sidebar-nav">
          <NavLink
            to="/my-profile"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <UserRound size={19} />
            My Profile
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-logout"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
              handleLogout();
            }}
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        className="main-content"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="mobile-menu"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div>
              <h1 className="dashboard-title">My Applications</h1>
              <p className="dashboard-subtitle">
                Track pre-validated execution manifests dispatched to official government portals
              </p>
            </div>
          </div>

          <div className="dashboard-user">
            {/* Backend Connectivity Badge */}
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              title="Click to configure backend IP / LAN settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 12px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: backendOnline ? "#a5efbd" : "#fecaca",
                background: backendOnline ? "#f0fff4" : "#fff5f5",
                color: backendOnline ? "#235a34" : "#b91c1c",
                fontSize: "12px",
                fontWeight: "750",
                cursor: "pointer",
              }}
            >
              <Wifi size={14} color={backendOnline ? "#367c4b" : "#dc2626"} />
              <span className="backend-btn-text">Backend: </span>{backendOnline ? "Online" : "Offline"}
            </button>

            <button
              style={{
                border: "none",
                background: "transparent",
                color: "#555",
                cursor: "pointer",
              }}
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <div
              className="dashboard-avatar"
              onClick={() => navigate("/my-profile")}
              style={{ cursor: "pointer" }}
              title="View Profile"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div style={{ padding: "30px" }}>
          {/* STATS OVERVIEW CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "30px",
            }}
          >
            <div className="dashboard-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "#e8fff0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardList size={22} color="#16803c" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#111" }}>{totalCount}</div>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>Total Dispatched</div>
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={22} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#111" }}>{processingCount}</div>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>In Processing</div>
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={22} color="#15803d" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#111" }}>{approvedCount}</div>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>Approved</div>
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={22} color="#0369a1" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#111" }}>{submittedCount}</div>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>Under Review</div>
              </div>
            </div>
          </div>

          {/* FILTER TABS & ACTIONS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: "All Applications", value: "all" },
                { label: "Processing", value: "processing" },
                { label: "Approved", value: "approved" },
                { label: "Submitted", value: "submitted" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: statusFilter === tab.value ? "#367c4b" : "#e5e7e5",
                    background: statusFilter === tab.value ? "#c7ffd8" : "#fff",
                    color: statusFilter === tab.value ? "#1f502d" : "#555",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadApplications}
              disabled={isLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "8px 14px",
                borderRadius: "8px",
                color: "#166534",
                fontWeight: "750",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} className={isLoading ? "spin-animation" : ""} />
              Refresh
            </button>
          </div>

          {/* APPLICATIONS LISTING */}
          {isLoading ? (
            <div style={{ padding: "50px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
              <RefreshCw size={26} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "13px", color: "#666" }}>Loading dispatched application records...</div>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="dashboard-card" style={{ padding: "50px 30px", textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#e8fff0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <ClipboardList size={28} color="#16803c" />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "0 0 8px" }}>
                {statusFilter === "all" ? "No Applications Dispatched Yet" : `No Applications in "${statusFilter}" status`}
              </h3>
              <p style={{ fontSize: "13px", color: "#777", maxWidth: "480px", margin: "0 auto 20px", lineHeight: "1.6" }}>
                Generate an Execution Draft Manifest for any scheme in the catalog to evaluate document readiness and dispatch your application directly.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <NavLink
                  to="/schemes-catalog"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "#111",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "750",
                    textDecoration: "none",
                  }}
                >
                  Explore Schemes Catalog
                </NavLink>
                <NavLink
                  to="/home"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "#f4f7f4",
                    color: "#333",
                    border: "1px solid #ddd",
                    fontSize: "13px",
                    fontWeight: "750",
                    textDecoration: "none",
                  }}
                >
                  Ask AI Assistant
                </NavLink>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="dashboard-card"
                  style={{
                    padding: "22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "18px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          background:
                            app.status?.toLowerCase() === "approved"
                              ? "#dcfce7"
                              : app.status?.toLowerCase() === "processing"
                              ? "#fef3c7"
                              : "#e0f2fe",
                          color:
                            app.status?.toLowerCase() === "approved"
                              ? "#15803d"
                              : app.status?.toLowerCase() === "processing"
                              ? "#b45309"
                              : "#0369a1",
                        }}
                      >
                        {app.status || "Submitted"}
                      </span>

                      <span style={{ fontSize: "12px", color: "#888", fontWeight: "600" }}>
                        Ref: <strong style={{ color: "#222" }}>{app.reference_number}</strong>
                      </span>

                      <span style={{ fontSize: "11px", color: "#999" }}>
                        &bull; {new Date(app.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 6px", color: "#111" }}>
                      {app.service_name}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666" }}>
                      <Building2 size={13} color="#888" />
                      <span>{app.department || "Ministry of Public Services"}</span>
                      {app.governance_tier && (
                        <span style={{ textTransform: "capitalize", color: "#888" }}>
                          &bull; {app.governance_tier} Tier
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 14px",
                        borderRadius: "8px",
                        background: "#e8fff0",
                        border: "1px solid #c7ffd8",
                        color: "#166534",
                        fontSize: "12px",
                        fontWeight: "750",
                        cursor: "pointer",
                      }}
                    >
                      <Eye size={14} /> View Details & Manifest
                    </button>

                    {app.portal_url && (
                      <a
                        href={app.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "9px 14px",
                          borderRadius: "8px",
                          background: "#111",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "750",
                          textDecoration: "none",
                        }}
                      >
                        Official Portal <ExternalLink size={13} />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(app)}
                      title="Remove record"
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        background: "#fff",
                        border: "1px solid #fee2e2",
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* APPLICATION DETAILS MODAL */}
      {selectedApp && (
        <div className="civic-modal-backdrop" onClick={() => setSelectedApp(null)} role="dialog" aria-modal="true">
          <div
            className="civic-modal-card civic-modal-large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "780px" }}
          >
            <div className="civic-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="civic-modal-icon">
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>{selectedApp.service_name}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>
                    Ref: {selectedApp.reference_number} &bull; Dispatched on {new Date(selectedApp.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="civic-modal-close" onClick={() => setSelectedApp(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="civic-modal-body">
              {/* Status Header Block */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  background: "#f9faf9",
                  border: "1px solid #e5e7e5",
                  marginBottom: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#888", textTransform: "uppercase" }}>Status</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#166534", marginTop: "2px" }}>
                    {selectedApp.status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#888", textTransform: "uppercase" }}>Department</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#222", marginTop: "2px" }}>
                    {selectedApp.department || "Government Service Gateway"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#888", textTransform: "uppercase" }}>Submission Date</div>
                  <div style={{ fontSize: "13px", color: "#444", marginTop: "2px" }}>
                    {new Date(selectedApp.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Attached Document Proofs */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Attached Proof Documents</h4>
                {selectedApp.file_attachments && selectedApp.file_attachments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedApp.file_attachments.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#fff",
                          border: "1px solid #e5e7e5",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FileText size={15} color="#166534" />
                          <span style={{ fontSize: "13px", fontWeight: "650" }}>{file.original_filename || file.document_type}</span>
                          <span style={{ fontSize: "11px", color: "#777" }}>({file.document_type})</span>
                        </div>
                        {file.signed_url && (
                          <a
                            href={file.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "11px",
                              color: "#166534",
                              fontWeight: "750",
                              textDecoration: "underline",
                            }}
                          >
                            Verify File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#777", margin: 0, fontStyle: "italic" }}>
                    No file attachments recorded with this manifest.
                  </p>
                )}
              </div>

              {/* Submitted Payload JSON */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", margin: 0 }}>Execution Payload Manifest</h4>
                  <button
                    type="button"
                    onClick={() => downloadManifestJson(selectedApp)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#166534",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                    }}
                  >
                    <Download size={13} /> Export JSON
                  </button>
                </div>

                <pre
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "#1e1e1e",
                    color: "#a5efbd",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    maxHeight: "240px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(selectedApp.form_payload || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="civic-modal-footer">
              <button
                type="button"
                onClick={() => downloadManifestJson(selectedApp)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
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
                <Download size={14} /> Download Manifest
              </button>

              {selectedApp.portal_url && (
                <a
                  href={selectedApp.portal_url}
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
                  Open Official Portal <ExternalLink size={13} />
                </a>
              )}

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{
                  padding: "9px 16px",
                  background: "#f3f4f6",
                  color: "#333",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontWeight: "750",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteConfirm && (
        <div className="civic-modal-backdrop" onClick={() => setShowDeleteConfirm(null)} role="dialog" aria-modal="true">
          <div className="civic-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="civic-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertCircle size={18} color="#991b1b" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Remove Record</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>Confirmation required</p>
                </div>
              </div>
              <button className="civic-modal-close" onClick={() => setShowDeleteConfirm(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="civic-modal-body">
              <p style={{ fontSize: "13px", color: "#333", margin: "0 0 8px" }}>
                Remove application <strong>{showDeleteConfirm.reference_number}</strong> from your records?
              </p>
              <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                This will delete the local tracking record for this submission.
              </p>
            </div>

            <div className="civic-modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: "8px 14px",
                  background: "#fff",
                  color: "#444",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm.id)}
                style={{
                  padding: "8px 16px",
                  background: "#991b1b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "750",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACKEND STATUS MODAL */}
      <BackendStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        initialStatus={backendOnline}
        onStatusChange={(isOnline) => setBackendOnline(isOnline)}
      />
    </div>
  );
}
