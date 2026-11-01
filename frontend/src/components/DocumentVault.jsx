import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Download,
  Lock,
  UploadCloud,
  FileImage,
  AlertTriangle,
  X,
  Check,
  Shield,
} from "lucide-react";
import { documentsApi } from "../api/services";
import {
  validateVaultFile,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "../utils/vaultValidation";

export default function DocumentVault() {
  const [documents, setDocuments] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("Identity Proof");
  const [customDocType, setCustomDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
    let ignore = false;
    documentsApi
      .getDocuments()
      .then((data) => {
        if (!ignore) {
          setDocuments(data);
          setListError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setListError(err.message || "Failed to load uploaded documents.");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const isLoading = (documents === null && !listError) || isRefreshing;

  async function handleRefreshList() {
    setIsRefreshing(true);
    setListError(null);
    try {
      const data = await documentsApi.getDocuments();
      setDocuments(data);
    } catch (err) {
      setListError(err.message || "Failed to load uploaded documents.");
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
      setUploadError("Please specify a document type.");
      return;
    }

    setUploading(true);

    try {
      const res = await documentsApi.uploadDocument(selectedFile, typeToUse);
      setUploadSuccess(
        `Successfully uploaded ${res.original_filename || selectedFile.name}!`
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

  const isPdf =
    selectedFile &&
    (selectedFile.type === "application/pdf" ||
      (selectedFile.name || "").toLowerCase().endsWith(".pdf"));

  const isUploadDisabled =
    uploading || !selectedFile || selectedFile.size > MAX_FILE_SIZE_BYTES;

  return (
    <section id="Document Vault" style={{ marginBottom: "35px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px", color: "#111827" }}>
          Citizen Document Vault
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Upload and organize verified certificates and identity proofs for automatic scheme dispatch.
        </p>
      </div>

      {/* Upload Box */}
      <div className="vault-upload-card" style={{ marginBottom: "25px" }}>
        <div className="vault-card-header">
          <div>
            <h3 className="vault-card-title">
              <UploadCloud size={19} color="#166534" />
              Upload New Document
            </h3>
            <p className="vault-card-subtitle">
              Strict 1 MB limit. Supported file formats: PDF, JPG, PNG.
            </p>
          </div>
          <div className="vault-limit-badge">
            <Shield size={13} color="#166534" />
            <span>
              Limit: <strong>{MAX_FILE_SIZE_LABEL}</strong>
            </span>
          </div>
        </div>

        {uploadSuccess && (
          <div className="vault-alert-success">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <div>{uploadSuccess}</div>
          </div>
        )}

        {uploadError && (
          <div className="vault-alert-error">
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>{uploadError}</div>
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="vault-form-grid">
            {/* Document Type Dropdown */}
            <div className="vault-form-col">
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
                  placeholder="Enter custom document type..."
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value)}
                  disabled={uploading}
                  className="vault-input"
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>

            {/* File Input & Dropzone */}
            <div className="vault-form-col">
              <label className="vault-label">
                <span>Select File (PDF, JPG, PNG)</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Max 1 MB</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: "none" }}
              />

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
                >
                  <div className="vault-dropzone-icon">
                    <UploadCloud size={22} />
                  </div>
                  <p className="vault-dropzone-title">
                    <span>Click to browse</span> or drag and drop
                  </p>
                  <p className="vault-dropzone-hint">
                    Maximum size: <strong>1 MB</strong> &bull; PDF, JPG, PNG
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
                      {isPdf ? <FileText size={18} /> : <FileImage size={18} />}
                    </div>
                    <div className="vault-selected-meta">
                      <div className="vault-selected-name" title={selectedFile.name}>
                        {selectedFile.name}
                      </div>
                      <div className="vault-selected-sub">
                        <span>{formatBytes(selectedFile.size)}</span>
                        <span className="vault-valid-pill">
                          <Check size={10} /> Valid (&le; 1 MB)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="vault-selected-actions">
                    <button
                      type="button"
                      className="vault-btn-remove"
                      onClick={handleClearFile}
                      disabled={uploading}
                    >
                      <X size={13} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="vault-form-footer">
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Accepted formats: PDF, JPG, PNG &bull; Strict 1 MB size limit
            </span>

            <button
              type="submit"
              disabled={isUploadDisabled}
              className="vault-btn-primary"
            >
              {uploading ? (
                <>
                  <RefreshCw size={15} className="spin-animation" />
                  Encrypting & Uploading Document...
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

      {/* Vault Document List */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#111827" }}>
              Stored Documents
            </h3>
            <span className="vault-count-badge">
              {documents ? documents.length : 0}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshList}
            disabled={isLoading}
            className="vault-btn-refresh"
          >
            <RefreshCw
              size={13}
              className={isLoading ? "spin-animation" : ""}
            />
            Refresh
          </button>
        </div>

        {listError && (
          <div className="vault-alert-error" style={{ marginBottom: "16px" }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>{listError}</div>
          </div>
        )}

        {isLoading && (
          <div
            style={{
              padding: "36px",
              textAlign: "center",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #e5e7e5",
            }}
          >
            <RefreshCw
              size={22}
              className="spin-animation"
              color="#367c4b"
              style={{ margin: "0 auto 8px" }}
            />
            <div style={{ fontSize: "13px", color: "#666" }}>
              Loading citizen vault...
            </div>
          </div>
        )}

        {!isLoading && documents && documents.length === 0 && (
          <div className="vault-empty-card">
            <div className="vault-empty-icon-wrap">
              <FolderOpen size={32} />
            </div>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "750",
                margin: "0 0 6px",
                color: "#111827",
              }}
            >
              Your Vault is Empty
            </h4>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Upload your Aadhaar, Income Certificate, or Marksheets above to auto-match with schemes.
            </p>
          </div>
        )}

        {!isLoading && documents && documents.length > 0 && (
          <div className="vault-table-container">
            <div style={{ overflowX: "auto" }}>
              <table className="civic-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Original Filename</th>
                    <th>MIME Type</th>
                    <th>File Size</th>
                    <th>Uploaded At</th>
                    <th>Secure Access</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id || doc.storage_path}>
                      <td>
                        <span className="vault-category-pill">
                          {doc.document_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#222" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FileText size={15} color="#666" />
                          {doc.original_filename}
                        </div>
                      </td>
                      <td style={{ fontSize: "12px", color: "#666" }}>
                        {doc.mime_type || "document"}
                      </td>
                      <td style={{ fontSize: "12px" }}>
                        {formatBytes(doc.file_size_bytes)}
                      </td>
                      <td style={{ fontSize: "12px", color: "#666" }}>
                        {doc.created_at
                          ? new Date(doc.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        {doc.signed_url ? (
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vault-action-btn-download"
                          >
                            <Download size={12} /> View File
                          </a>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              color: "#777",
                            }}
                          >
                            <Lock size={12} /> Stored Privately
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
