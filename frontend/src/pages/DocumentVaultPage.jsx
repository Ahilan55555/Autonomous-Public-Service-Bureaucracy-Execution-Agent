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
  UploadCloud,
  FileImage,
  Shield,
  Check,
} from "lucide-react";

import { healthApi, documentsApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import {
  validateVaultFile,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "../utils/vaultValidation";
import "../App.css";

export default function DocumentVaultPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 850 : true
  );
  const [profile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("citizenProfile") || "{}");
    } catch {
      return {};
    }
  });

  const userName =
    profile.full_name || localStorage.getItem("user_name") || "Citizen";
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Stored Documents Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

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

  useEffect(() => {
    let isMounted = true;
    healthApi.checkHealth().then((res) => {
      if (isMounted) {
        setBackendOnline(res.status === "ok");
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

  function processSelectedFile(file) {
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Strict 1 MB file size and format validation
    const validation = validateVaultFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  }

  function handleClearFile(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    // Strict validation before submission
    const validation = validateVaultFile(selectedFile);
    if (!validation.valid) {
      setUploadError(validation.error);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const typeToUse =
      documentType === "Other" ? customDocType.trim() : documentType;
    if (!typeToUse) {
      setUploadError("Please specify a document category or type.");
      return;
    }

    setUploading(true);
    try {
      const res = await documentsApi.uploadDocument(selectedFile, typeToUse);
      setUploadSuccess(
        `Document "${res.original_filename || selectedFile.name}" was uploaded successfully to your vault!`
      );
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

  // Filtered documents
  const filteredDocuments = (documents || []).filter((doc) => {
    const matchesCategory =
      categoryFilter === "All" || doc.document_type === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (doc.original_filename || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (doc.document_type || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isPdf =
    selectedFile &&
    (selectedFile.type === "application/pdf" ||
      (selectedFile.name || "").toLowerCase().endsWith(".pdf"));

  const isUploadDisabled =
    uploading ||
    !selectedFile ||
    selectedFile.size > MAX_FILE_SIZE_BYTES;

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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
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
              <span className="backend-btn-text">Backend: </span>
              {backendOnline ? "Online" : "Offline"}
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

        {/* PAGE CONTENT CONTAINER */}
        <div style={{ padding: "26px 30px 40px" }}>
          <div className="vault-container">
            {/* SECURITY & TRUST BANNER */}
            <div className="vault-banner">
              <div className="vault-banner-left">
                <div className="vault-banner-icon">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="vault-banner-title">
                    Tamper-Proof Citizen Credential Vault
                  </h2>
                  <p className="vault-banner-desc">
                    Official documents are encrypted and used to auto-verify eligibility across public welfare schemes.
                  </p>
                </div>
              </div>
              <div className="vault-security-pill">
                <Lock size={13} /> 256-Bit Encrypted &bull; Govt Verified
              </div>
            </div>

            {/* UPLOAD NEW DOCUMENT CARD */}
            <div className="vault-upload-card">
              <div className="vault-card-header">
                <div>
                  <h2 className="vault-card-title">
                    <UploadCloud size={20} color="#166534" />
                    Upload New Document
                  </h2>
                  <p className="vault-card-subtitle">
                    Select a document category and choose a PDF, JPG, or PNG file under 1 MB.
                  </p>
                </div>
                <div className="vault-limit-badge">
                  <Shield size={13} color="#166534" />
                  <span>
                    Upload Limit: <strong>{MAX_FILE_SIZE_LABEL}</strong> (1,048,576 bytes)
                  </span>
                </div>
              </div>

              {/* SUCCESS NOTIFICATION */}
              {uploadSuccess && (
                <div className="vault-alert-success" role="alert">
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <div>{uploadSuccess}</div>
                </div>
              )}

              {/* ERROR NOTIFICATION */}
              {uploadError && (
                <div className="vault-alert-error" role="alert">
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>{uploadError}</div>
                </div>
              )}

              <form onSubmit={handleUpload}>
                <div className="vault-form-grid">
                  {/* Category Selection Column */}
                  <div className="vault-form-col">
                    <div>
                      <label className="vault-label">
                        <span>Document Category / Type</span>
                        <span className="vault-label-required">Required</span>
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        disabled={uploading}
                        className="vault-select"
                      >
                        {documentTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      {documentType === "Other" && (
                        <input
                          type="text"
                          placeholder="Specify custom document type..."
                          value={customDocType}
                          onChange={(e) => setCustomDocType(e.target.value)}
                          disabled={uploading}
                          className="vault-input"
                          style={{ marginTop: "10px" }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: "#1e293b", display: "block", marginBottom: "3px" }}>
                        Verification Notice:
                      </strong>
                      Uploaded credentials are parsed by the AI Verification Engine to automatically qualify your citizen profile for direct scheme benefits.
                    </div>
                  </div>

                  {/* File Selection & Dropzone Column */}
                  <div className="vault-form-col">
                    <div>
                      <div className="vault-label">
                        <span>Select Document</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          PDF, JPG, or PNG (Max 1 MB)
                        </span>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        style={{ display: "none" }}
                        id="vault-file-input"
                      />

                      {/* Dynamic File Dropzone / Selected File Card */}
                      {!selectedFile ? (
                        <div
                          className={`vault-dropzone ${isDragging ? "dragging" : ""}`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              fileInputRef.current?.click();
                            }
                          }}
                          aria-label="Upload document file input dropzone"
                        >
                          <div className="vault-dropzone-icon">
                            <UploadCloud size={24} />
                          </div>
                          <p className="vault-dropzone-title">
                            <span>Click to browse</span> or drag and drop your file here
                          </p>
                          <p className="vault-dropzone-hint">
                            Maximum allowed file size: <strong>1 MB</strong> &bull; Supported formats: <strong>PDF, JPG, PNG</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="vault-selected-card">
                          <div className="vault-selected-info">
                            <div
                              className={`vault-selected-file-icon ${
                                isPdf ? "pdf" : "image"
                              }`}
                            >
                              {isPdf ? <FileText size={20} /> : <FileImage size={20} />}
                            </div>
                            <div className="vault-selected-meta">
                              <div className="vault-selected-name" title={selectedFile.name}>
                                {selectedFile.name}
                              </div>
                              <div className="vault-selected-sub">
                                <span>{formatBytes(selectedFile.size)}</span>
                                <span className="vault-valid-pill">
                                  <Check size={11} /> Size OK (&le; 1 MB)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="vault-selected-actions">
                            <button
                              type="button"
                              className="vault-btn-remove"
                              onClick={handleClearFile}
                              title="Remove selected file"
                              disabled={uploading}
                            >
                              <X size={14} /> Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#374151",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Footer Action */}
                <div className="vault-form-footer">
                  <div className="vault-form-info-note">
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>
                      Files are cryptographically checksummed and validated against strict 1 MB security limits.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadDisabled}
                    className="vault-btn-primary"
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
                </div>
              </form>
            </div>

            {/* STORED DOCUMENTS SECTION */}
            <div>
              <div className="vault-stored-header">
                <div>
                  <div className="vault-stored-title-group">
                    <h2 style={{ fontSize: "19px", fontWeight: "800", margin: 0, color: "#111827" }}>
                      Stored Documents
                    </h2>
                    <span className="vault-count-badge">
                      {documents ? documents.length : 0}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                    Persistent verifiable credentials associated with your authenticated citizen account.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {documents && documents.length > 0 && (
                    <>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                          height: "36px",
                          padding: "0 10px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          fontSize: "12px",
                          background: "#fff",
                          color: "#374151",
                          fontWeight: "650",
                          cursor: "pointer",
                        }}
                      >
                        <option value="All">All Categories</option>
                        {documentTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <div style={{ position: "relative" }}>
                        <Search
                          size={14}
                          color="#94a3b8"
                          style={{ position: "absolute", left: "10px", top: "11px" }}
                        />
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            height: "36px",
                            paddingLeft: "30px",
                            paddingRight: "10px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            fontSize: "12px",
                            width: "150px",
                          }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleRefreshList}
                    disabled={isLoading}
                    className="vault-btn-refresh"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoading ? "spin-animation" : ""}
                    />
                    Refresh Vault
                  </button>
                </div>
              </div>

              {listError && (
                <div className="vault-alert-error" style={{ marginBottom: "16px" }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>{listError}</div>
                </div>
              )}

              {/* LOADING STATE */}
              {isLoading && (
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e5e7e5",
                    boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
                  }}
                >
                  <RefreshCw
                    size={28}
                    className="spin-animation"
                    color="#16803c"
                    style={{ margin: "0 auto 12px" }}
                  />
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>
                    Retrieving Encrypted Citizen Documents...
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    Synchronizing tamper-evident credentials from the vault server.
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {!isLoading && documents && documents.length === 0 && (
                <div className="vault-empty-card">
                  <div className="vault-empty-icon-wrap">
                    <FolderOpen size={32} />
                  </div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: "800",
                      color: "#111827",
                      margin: "0 0 6px",
                    }}
                  >
                    Your Document Vault is Empty
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      maxWidth: "460px",
                      margin: "0 auto 18px",
                      lineHeight: 1.5,
                    }}
                  >
                    Upload your Identity Proof, Income Certificate, or Academic Marksheets above. Uploaded files must be under 1 MB and formatted as PDF, JPG, or PNG.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="vault-btn-primary"
                    style={{ margin: "0 auto" }}
                  >
                    <Upload size={14} /> Select Document to Upload
                  </button>
                </div>
              )}

              {/* FILTER EMPTY STATE */}
              {!isLoading && documents && documents.length > 0 && filteredDocuments.length === 0 && (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "#fff",
                    borderRadius: "14px",
                    border: "1px solid #e5e7e5",
                  }}
                >
                  <Search size={28} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#334155", margin: "0 0 4px" }}>
                    No matching documents found
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    Try clearing the search query or selecting a different category filter.
                  </p>
                </div>
              )}

              {/* DOCUMENTS DATA TABLE */}
              {!isLoading && filteredDocuments.length > 0 && (
                <div className="vault-table-container">
                  <div style={{ overflowX: "auto" }}>
                    <table className="civic-table">
                      <thead>
                        <tr>
                          <th style={{ width: "20%" }}>Category</th>
                          <th style={{ width: "35%" }}>Document Name</th>
                          <th style={{ width: "15%" }}>MIME Type</th>
                          <th style={{ width: "12%" }}>Size</th>
                          <th style={{ width: "18%", textAlign: "right" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => {
                          const docIsPdf =
                            (doc.mime_type || "").includes("pdf") ||
                            (doc.original_filename || "")
                              .toLowerCase()
                              .endsWith(".pdf");

                          return (
                            <tr key={doc.id || doc.storage_path}>
                              <td>
                                <span className="vault-category-pill">
                                  {doc.document_type}
                                </span>
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "8px",
                                      background: docIsPdf ? "#fee2e2" : "#e0e7ff",
                                      color: docIsPdf ? "#dc2626" : "#4f46e5",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {docIsPdf ? (
                                      <FileText size={16} />
                                    ) : (
                                      <FileImage size={16} />
                                    )}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: "750",
                                        color: "#111827",
                                        fontSize: "13px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "260px",
                                      }}
                                      title={doc.original_filename}
                                    >
                                      {doc.original_filename}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                      {doc.created_at
                                        ? new Date(doc.created_at).toLocaleDateString()
                                        : "Stored in Vault"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: "12px", color: "#64748b" }}>
                                {doc.mime_type || "application/octet-stream"}
                              </td>
                              <td style={{ fontSize: "12px", fontWeight: "650", color: "#334155" }}>
                                {formatBytes(doc.file_size_bytes)}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {/* View / Preview Button */}
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(doc)}
                                    title="Preview document"
                                    className="vault-action-btn-view"
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
                                      className="vault-action-btn-download"
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
                                        color: "#94a3b8",
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
                                    className="vault-action-btn-delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div
          className="civic-modal-backdrop"
          onClick={() => setPreviewDoc(null)}
          role="dialog"
          aria-modal="true"
        >
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
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>
                    {previewDoc.original_filename}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>
                    Category: {previewDoc.document_type} &bull; Size:{" "}
                    {formatBytes(previewDoc.file_size_bytes)}
                  </p>
                </div>
              </div>
              <button
                className="civic-modal-close"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="civic-modal-body"
              style={{
                minHeight: "350px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {previewDoc.signed_url ? (
                previewDoc.mime_type?.includes("image") ||
                /\.(jpg|jpeg|png)$/i.test(previewDoc.original_filename) ? (
                  <img
                    src={previewDoc.signed_url}
                    alt={previewDoc.original_filename}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "500px",
                      borderRadius: "8px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <iframe
                    src={previewDoc.signed_url}
                    title={previewDoc.original_filename}
                    style={{
                      width: "100%",
                      height: "480px",
                      border: "1px solid #e5e7e5",
                      borderRadius: "8px",
                    }}
                  />
                )
              ) : (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Lock
                    size={40}
                    color="#367c4b"
                    style={{ margin: "0 auto 12px" }}
                  />
                  <h4 style={{ fontSize: "16px", fontWeight: "750", margin: "0 0 6px" }}>
                    Encrypted Citizen Document
                  </h4>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      maxWidth: "420px",
                      margin: "0 auto",
                    }}
                  >
                    This document is stored securely in the vault and verified for government eligibility checks.
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
                  className="vault-action-btn-download"
                  style={{ padding: "9px 16px", fontSize: "12px" }}
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
        <div
          className="civic-modal-backdrop"
          onClick={() => setDocToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="civic-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div className="civic-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={18} color="#991b1b" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>
                    Delete Document
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>
                    Confirmation required
                  </p>
                </div>
              </div>
              <button
                className="civic-modal-close"
                onClick={() => setDocToDelete(null)}
                aria-label="Close"
              >
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
