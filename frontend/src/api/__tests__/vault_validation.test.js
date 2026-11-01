import assert from "node:assert/strict";
import {
  validateVaultFile,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  FILE_SIZE_ERROR_MESSAGE,
  FILE_FORMAT_ERROR_MESSAGE,
} from "../../utils/vaultValidation.js";

console.log("Starting Citizen Document Vault validation tests...\n");

// Helper mock file
function createMockFile(name, size, type) {
  return {
    name,
    size,
    type,
  };
}

// 1. Valid PDF file under 1 MB
{
  const file = createMockFile("aadhaar_card.pdf", 500 * 1024, "application/pdf");
  const res = validateVaultFile(file);
  assert.equal(res.valid, true, "500KB PDF should be valid");
  assert.equal(res.error, null);
  console.log("✓ Test 1: 500 KB PDF is accepted");
}

// 2. Exactly 1 MB file (1,048,576 bytes)
{
  assert.equal(MAX_FILE_SIZE_BYTES, 1048576, "MAX_FILE_SIZE_BYTES must be 1,048,576 bytes");
  const file = createMockFile("driving_license.jpg", MAX_FILE_SIZE_BYTES, "image/jpeg");
  const res = validateVaultFile(file);
  assert.equal(res.valid, true, "Exactly 1,048,576 bytes JPG should be valid");
  assert.equal(res.error, null);
  console.log("✓ Test 2: Exactly 1 MB (1,048,576 bytes) JPG is accepted");
}

// 3. Exactly 1 MB + 1 byte (1,048,577 bytes) -> must be rejected
{
  const file = createMockFile("income_cert.png", 1048577, "image/png");
  const res = validateVaultFile(file);
  assert.equal(res.valid, false, "1,048,577 bytes must be rejected");
  assert.equal(res.error, FILE_SIZE_ERROR_MESSAGE);
  assert.equal(
    res.error,
    "File size exceeds 1 MB. Please compress your file below 1 MB and try again."
  );
  console.log("✓ Test 3: 1 MB + 1 byte is rejected with exact required error message");
}

// 4. 2 MB file -> rejected
{
  const file = createMockFile("marksheet.pdf", 2 * 1024 * 1024, "application/pdf");
  const res = validateVaultFile(file);
  assert.equal(res.valid, false);
  assert.equal(res.error, FILE_SIZE_ERROR_MESSAGE);
  console.log("✓ Test 4: 2 MB file is rejected with exact required error message");
}

// 5. 0-byte file -> rejected
{
  const file = createMockFile("empty.pdf", 0, "application/pdf");
  const res = validateVaultFile(file);
  assert.equal(res.valid, false);
  assert.match(res.error, /empty/i);
  console.log("✓ Test 5: 0-byte empty file is rejected");
}

// 6. Disallowed format (.exe, .txt, .docx) -> rejected
{
  const file = createMockFile("malicious.exe", 200 * 1024, "application/x-msdownload");
  const res = validateVaultFile(file);
  assert.equal(res.valid, false);
  assert.equal(res.error, FILE_FORMAT_ERROR_MESSAGE);
  console.log("✓ Test 6: Non-PDF/JPG/PNG format is rejected");
}

// 7. Format bytes helper checks
{
  assert.equal(formatBytes(0), "0 Bytes");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1048576), "1 MB");
  assert.equal(formatBytes(524288), "512 KB");
  console.log("✓ Test 7: formatBytes returns correct values");
}

console.log("\nAll 7 validation tests passed successfully!");
