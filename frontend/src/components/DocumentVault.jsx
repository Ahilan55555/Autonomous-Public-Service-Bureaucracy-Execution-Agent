import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Download,
  Lock,
} from "lucide-react";
import { documentsApi } from "../api/services";

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

    // Limit client-side validation to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25MB. Please choose a smaller document.");
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
      setUploadError("Please specify a document type.");
      return;
    }

    setUploading(true);

    try {
      const res = await documentsApi.uploadDocument(selectedFile, typeToUse);
      setUploadSuccess(`Successfully uploaded ${res.original_filename || selectedFile.name}!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Refresh documents list
      await handleRefreshList();
    } catch (err) {
      // Keep existing documents visible if upload fails
      setUploadError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  return (
    <section id="Document Vault" style={{ marginBottom: "35px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>
          Citizen Document Vault
        </h2>
        <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
          Upload and organize verified certificates and identity proofs for automatic scheme dispatch
        </p>
      </div>

      {/* Upload Box */}
      <div
        className="dashboard-card"
        style={{ padding: "24px", marginBottom: "25px" }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 16px" }}>
          Upload New Document
        </h3>

        {uploadSuccess && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#e8fff0",
              border: "1px solid #a5efbd",
              color: "#16803c",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            {uploadSuccess}
          </div>
        )}

        {uploadError && (
          <div className="auth-error" style={{ marginBottom: "16px" }}>
            {uploadError}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="vault-upload-grid">
            {/* Document Type Dropdown */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
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
                  placeholder="Enter custom document type..."
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

            {/* File Input */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                Select File (PDF, JPEG, PNG)
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
                Encrypting & Uploading Document...
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

      {/* Vault Document List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0 }}>
            Stored Documents ({documents ? documents.length : 0})
          </h3>
          <button
            type="button"
            onClick={handleRefreshList}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              color: "#367c4b",
              fontWeight: "700",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={isLoading ? "spin-animation" : ""} />
            Refresh
          </button>
        </div>

        {listError && (
          <div className="auth-error" style={{ marginBottom: "16px" }}>
            {listError}
          </div>
        )}

        {isLoading && (
          <div style={{ padding: "30px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
            <RefreshCw size={22} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "12px", color: "#666" }}>Loading citizen vault...</div>
          </div>
        )}

        {!isLoading && documents && documents.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
            <FolderOpen size={36} color="#aaa" style={{ margin: "0 auto 10px" }} />
            <h4 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 6px" }}>Your Vault is Empty</h4>
            <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
              Upload your Aadhaar, Income Certificate, or Marksheets above to auto-match with schemes.
            </p>
          </div>
        )}

        {!isLoading && documents && documents.length > 0 && (
          <div style={{ overflowX: "auto", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7e5" }}>
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
                    <td style={{ fontWeight: "700" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
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
                    <td style={{ fontWeight: "600", color: "#222" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={15} color="#666" />
                        {doc.original_filename}
                      </div>
                    </td>
                    <td style={{ fontSize: "12px", color: "#666" }}>{doc.mime_type}</td>
                    <td style={{ fontSize: "12px" }}>{formatBytes(doc.file_size_bytes)}</td>
                    <td style={{ fontSize: "12px", color: "#666" }}>
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td>
                      {/* Only use signed_url when present. Never display storage_path as a link! */}
                      {doc.signed_url ? (
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "#111",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "700",
                            textDecoration: "none",
                          }}
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
        )}
      </div>
    </section>
  );
}
