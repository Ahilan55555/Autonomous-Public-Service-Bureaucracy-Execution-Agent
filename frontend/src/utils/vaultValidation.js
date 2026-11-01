/**
 * Citizen Document Vault - File Validation and Size Enforcement
 * Strict 1 MB (1,048,576 bytes) upload limit for PDF, JPG, and PNG files.
 */

export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1,048,576 bytes (1 MB)
export const MAX_FILE_SIZE_LABEL = "1 MB";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

export const FILE_SIZE_ERROR_MESSAGE =
  "File size exceeds 1 MB. Please compress your file below 1 MB and try again.";

export const FILE_FORMAT_ERROR_MESSAGE =
  "Unsupported format. Only PDF, JPG, and PNG files are allowed.";

/**
 * Format raw byte count into human-readable representation (Bytes, KB, MB)
 */
export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "0 Bytes";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2));
  return `${val} ${sizes[i]}`;
}

/**
 * Validates a file against the strict 1 MB and format constraints
 * @param {File} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateVaultFile(file) {
  if (!file) {
    return { valid: false, error: "Please select a file to upload." };
  }

  // 1. Check for empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty (0 Bytes). Please choose a valid document.",
    };
  }

  // 2. Immediate check for size exceeding 1 MB (1,048,576 bytes)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: FILE_SIZE_ERROR_MESSAGE,
    };
  }

  // 3. Check format (PDF, JPG, PNG)
  const filename = (file.name || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    filename.endsWith(ext)
  );
  const hasValidMime = ALLOWED_MIME_TYPES.includes(fileType);

  if (!hasValidExtension && !hasValidMime) {
    return {
      valid: false,
      error: FILE_FORMAT_ERROR_MESSAGE,
    };
  }

  return { valid: true, error: null };
}
