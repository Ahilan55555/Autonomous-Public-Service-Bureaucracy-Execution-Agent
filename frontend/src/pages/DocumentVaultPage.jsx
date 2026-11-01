import { useState, useEffect, useRef } from "react";
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
  Upload,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Download,
  Eye,
  Trash2,
  Lock,
  AlertTriangle,
} from "lucide-react";

import { healthApi, documentsApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import "../App.css";

export default function DocumentVaultPage() {
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

  // Vault state
  const [documents, setDocuments] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("Identity Proof");
  const [customDocType, setCustomDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const fileInputRef = useRef(null);

  // Interactive Modals
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const documentTypes = [
    "Identity Proof",
    "Driving License",
    "Income Certificate",
    "Address Proof",
    "Community Certificate",
    "Nativity Certificate",
    "Birth Certificate",
    "Marksheet",
    "Bank Passbook",
    "Other",
  ];

  const allowedFormats = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

  useEffect(() => {
    let isMounted = true;
    healthApi.checkHealth().then((res) => {
      if (isMounted) {
        setBackendOnline(res.status === "online");
      }
    });

    documentsApi
      .getDocuments()
      .then((data) => {
        if (isMounted) {
          setDocuments(data);
          setListError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setListError(err.message || "Failed to load documents from backend.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRefreshList() {
    setIsRefreshing(true);
    setListError(null);
    try {
      const data = await documentsApi.getDocuments();
      setDocuments(data);
    } catch (err) {
      setListError(err.message || "Failed to refresh documents.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size === 0) {
      setUploadError("The selected file is empty. Please choose a valid file.");
      setSelectedFile(null);
      return;
    }

    // Format validation
    if (!allowedFormats.includes(file.type.toLowerCase()) && !/\.(pdf|jpg|jpeg|png)$/i.test(file.name)) {
      setUploadError("Unsupported format. Please select a PDF, JPEG, or PNG document.");
      setSelectedFile(null);
      return;
    }

    // 25MB file size limit
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25MB limit. Please upload a smaller document.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const typeToUse = documentType === "Other" ? customDocType.trim() : documentType;
    if (!typeToUse) {
      setUploadError("Please specify a document category or type.");
      return;
    }

    setUploading(true);
    try {
      const res = await documentsApi.uploadDocument(selectedFile, typeToUse);
      setUploadSuccess(`Successfully uploaded and verified ${res.original_filename || selectedFile.name}!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await handleRefreshList();
    } catch (err) {
      setUploadError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await documentsApi.deleteDocument(docToDelete.id);
      setDocToDelete(null);
      await handleRefreshList();
    } catch (err) {
      setListError(err.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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

  const isLoading = (documents === null && !listError) || isRefreshing;

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
              <h1 className="dashboard-title">Citizen Document Vault</h1>
              <p className="dashboard-subtitle">
                Securely store and manage official certificates, identity proofs, and credentials
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
          {/* Upload New Document Card */}
          <div className="dashboard-card" style={{ padding: "26px", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 6px" }}>
              Upload New Document
            </h2>
            <p style={{ fontSize: "13px", color: "#666", margin: "0 0 20px" }}>
              Upload verifiable credentials to auto-satisfy eligibility checks and manifest generation.
            </p>

            {uploadSuccess && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "#e8fff0",
                  border: "1px solid #a5efbd",
                  color: "#16803c",
                  fontSize: "13px",
                  fontWeight: "650",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={18} />
                {uploadSuccess}
              </div>
            )}

            {uploadError && (
              <div className="auth-error" style={{ marginBottom: "18px" }}>
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div className="vault-upload-grid">
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "750", marginBottom: "6px" }}>
                    Document Category / Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    disabled={uploading}
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "13px",
                      background: "#fff",
                    }}
                  >
                    {documentTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {documentType === "Other" && (
                    <input
                      type="text"
                      placeholder="Specify document name..."
                      value={customDocType}
                      onChange={(e) => setCustomDocType(e.target.value)}
                      disabled={uploading}
                      style={{
                        width: "100%",
                        height: "40px",
                        marginTop: "8px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "13px",
                      }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "750", marginBottom: "6px" }}>
                    Select Document (PDF, JPEG, PNG)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      height: "46px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px dashed #bbb",
                      background: "#f9faf9",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      style={{ fontSize: "12px", flex: 1 }}
                    />
                  </div>
                  {selectedFile && (
                    <div style={{ fontSize: "11px", color: "#367c4b", fontWeight: "600", marginTop: "4px" }}>
                      Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                style={{
                  padding: "12px 24px",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "750",
                  fontSize: "13px",
                  cursor: uploading || !selectedFile ? "not-allowed" : "pointer",
                  opacity: uploading || !selectedFile ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={15} className="spin-animation" />
                    Encrypting & Storing in Vault...
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Upload to Vault
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Stored Documents Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", margin: 0 }}>
                  Stored Documents ({documents ? documents.length : 0})
                </h2>
                <p style={{ fontSize: "13px", color: "#777", margin: "4px 0 0" }}>
                  Persistent credentials associated with your authenticated citizen account
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshList}
                disabled={isLoading}
                style={{
                  display: "flex",
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
                <RefreshCw size={14} className={isLoading ? "spin-animation" : ""} />
                Refresh Vault
              </button>
            </div>

            {listError && (
              <div className="auth-error" style={{ marginBottom: "16px" }}>
                {listError}
              </div>
            )}

            {isLoading && (
              <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
                <RefreshCw size={24} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: "13px", color: "#666" }}>Retrieving encrypted citizen documents...</div>
              </div>
            )}

            {!isLoading && documents && documents.length === 0 && (
              <div style={{ padding: "50px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
                <FolderOpen size={42} color="#999" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "750", margin: "0 0 6px" }}>Your Vault is Empty</h3>
                <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
                  Upload your Aadhaar, Income Certificate, or educational marksheets above to qualify for scheme benefits.
                </p>
              </div>
            )}

            {!isLoading && documents && documents.length > 0 && (
              <div style={{ overflowX: "auto", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7e5" }}>
                <table className="civic-table">
                  <thead>
                    <tr>
                      <th>Document Category</th>
                      <th>Filename</th>
                      <th>MIME Type</th>
                      <th>Size</th>
                      <th>Upload Date</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id || doc.storage_path}>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              background: "#e8f8ed",
                              color: "#16803c",
                              fontSize: "11px",
                              fontWeight: "750",
                            }}
                          >
                            {doc.document_type}
                          </span>
                        </td>
                        <td style={{ fontWeight: "650", color: "#222" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FileText size={16} color="#555" />
                            {doc.original_filename}
                          </div>
                        </td>
                        <td style={{ fontSize: "12px", color: "#666" }}>{doc.mime_type || "document"}</td>
                        <td style={{ fontSize: "12px" }}>{formatBytes(doc.file_size_bytes)}</td>
                        <td style={{ fontSize: "12px", color: "#666" }}>
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td>
                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                            {/* View / Preview Button */}
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              title="Preview document"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: "#f3f4f6",
                                border: "1px solid #d1d5db",
                                color: "#111",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={13} /> View
                            </button>

                            {/* Download Button */}
                            {doc.signed_url ? (
                              <a
                                href={doc.signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.original_filename}
                                title="Download document"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  background: "#111",
                                  color: "#fff",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  textDecoration: "none",
                                }}
                              >
                                <Download size={13} /> Download
                              </a>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "11px",
                                  color: "#777",
                                  padding: "6px 8px",
                                }}
                              >
                                <Lock size={12} /> Stored
                              </span>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDocToDelete(doc)}
                              title="Delete document"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                background: "#fee2e2",
                                border: "1px solid #fca5a5",
                                color: "#991b1b",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="civic-modal-backdrop" onClick={() => setPreviewDoc(null)} role="dialog" aria-modal="true">
          <div
            className="civic-modal-card civic-modal-large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px" }}
          >
            <div className="civic-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="civic-modal-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>{previewDoc.original_filename}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>
                    Category: {previewDoc.document_type} &bull; Size: {formatBytes(previewDoc.file_size_bytes)}
                  </p>
                </div>
              </div>
              <button className="civic-modal-close" onClick={() => setPreviewDoc(null)} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>

            <div className="civic-modal-body" style={{ minHeight: "350px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {previewDoc.signed_url ? (
                previewDoc.mime_type?.includes("image") || /\.(jpg|jpeg|png)$/i.test(previewDoc.original_filename) ? (
                  <img
                    src={previewDoc.signed_url}
                    alt={previewDoc.original_filename}
                    style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px", objectFit: "contain" }}
                  />
                ) : (
                  <iframe
                    src={previewDoc.signed_url}
                    title={previewDoc.original_filename}
                    style={{ width: "100%", height: "480px", border: "1px solid #e5e7e5", borderRadius: "8px" }}
                  />
                )
              ) : (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Lock size={40} color="#367c4b" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ fontSize: "16px", fontWeight: "750", margin: "0 0 6px" }}>Encrypted Private Document</h4>
                  <p style={{ fontSize: "13px", color: "#666", maxWidth: "420px", margin: "0 auto" }}>
                    This document is stored securely in the citizen vault and verified for government eligibility checks.
                  </p>
                </div>
              )}
            </div>

            <div className="civic-modal-footer">
              {previewDoc.signed_url && (
                <a
                  href={previewDoc.signed_url}
                  download={previewDoc.original_filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 16px",
                    borderRadius: "8px",
                    background: "#166534",
                    color: "#fff",
                    fontWeight: "750",
                    fontSize: "12px",
                    textDecoration: "none",
                  }}
                >
                  <Download size={14} /> Download File
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
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
      {docToDelete && (
        <div className="civic-modal-backdrop" onClick={() => setDocToDelete(null)} role="dialog" aria-modal="true">
          <div className="civic-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="civic-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={18} color="#991b1b" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Delete Document</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>Confirmation required</p>
                </div>
              </div>
              <button className="civic-modal-close" onClick={() => setDocToDelete(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="civic-modal-body">
              <p style={{ fontSize: "13px", color: "#333", margin: "0 0 10px" }}>
                Are you sure you want to remove <strong>{docToDelete.original_filename}</strong> from your document vault?
              </p>
              <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                This file will no longer be available for automated eligibility verification.
              </p>
            </div>

            <div className="civic-modal-footer">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={deleting}
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
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  background: "#991b1b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "750",
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={13} className="spin-animation" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Document
                  </>
                )}
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
