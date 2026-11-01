/* global process */
import { validatePassword, validateEmail } from "../../utils/password.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log("--- 1. Testing Invalid Password Examples from Specification ---");

// Example 1: 12345678 (Only digits)
const res1 = validatePassword("12345678");
assert(!res1.isValid, "'12345678' is invalid");
assert(res1.results.find((r) => r.id === "length").passed === true, "12345678 meets length (>=8)");
assert(res1.results.find((r) => r.id === "uppercase").passed === false, "12345678 fails uppercase");
assert(res1.results.find((r) => r.id === "lowercase").passed === false, "12345678 fails lowercase");
assert(res1.results.find((r) => r.id === "digit").passed === true, "12345678 passes digit");
assert(res1.results.find((r) => r.id === "special").passed === false, "12345678 fails special char");

// Example 2: abcdefgh (Only lowercase letters)
const res2 = validatePassword("abcdefgh");
assert(!res2.isValid, "'abcdefgh' is invalid");
assert(res2.results.find((r) => r.id === "length").passed === true, "abcdefgh meets length");
assert(res2.results.find((r) => r.id === "uppercase").passed === false, "abcdefgh fails uppercase");
assert(res2.results.find((r) => r.id === "lowercase").passed === true, "abcdefgh passes lowercase");
assert(res2.results.find((r) => r.id === "digit").passed === false, "abcdefgh fails digit");
assert(res2.results.find((r) => r.id === "special").passed === false, "abcdefgh fails special char");

// Example 3: Hari1234 (No special character)
const res3 = validatePassword("Hari1234");
assert(!res3.isValid, "'Hari1234' is invalid");
assert(res3.results.find((r) => r.id === "length").passed === true, "Hari1234 meets length");
assert(res3.results.find((r) => r.id === "uppercase").passed === true, "Hari1234 passes uppercase");
assert(res3.results.find((r) => r.id === "lowercase").passed === true, "Hari1234 passes lowercase");
assert(res3.results.find((r) => r.id === "digit").passed === true, "Hari1234 passes digit");
assert(res3.results.find((r) => r.id === "special").passed === false, "Hari1234 fails special char");

// Example 4: Hari@12 (Less than 8 characters)
const res4 = validatePassword("Hari@12");
assert(!res4.isValid, "'Hari@12' is invalid");
assert(res4.results.find((r) => r.id === "length").passed === false, "Hari@12 fails length (<8)");
assert(res4.results.find((r) => r.id === "uppercase").passed === true, "Hari@12 passes uppercase");
assert(res4.results.find((r) => r.id === "lowercase").passed === true, "Hari@12 passes lowercase");
assert(res4.results.find((r) => r.id === "digit").passed === true, "Hari@12 passes digit");
assert(res4.results.find((r) => r.id === "special").passed === true, "Hari@12 passes special char");

console.log("\n--- 2. Testing Valid Password Examples from Specification ---");

// Example 5: Hari@1234 (Meets all requirements)
const res5 = validatePassword("Hari@1234");
assert(res5.isValid === true, "'Hari@1234' meets all requirements");
assert(res5.results.every((r) => r.passed), "All 5 individual rules passed for Hari@1234");

// Example 6: Civic#2026 (Meets all requirements)
const res6 = validatePassword("Civic#2026");
assert(res6.isValid === true, "'Civic#2026' meets all requirements");
assert(res6.results.every((r) => r.passed), "All 5 individual rules passed for Civic#2026");

console.log("\n--- 3. Testing Email Validation ---");
assert(validateEmail("user@example.com") === true, "user@example.com is valid");
assert(validateEmail("citizen.care@gov.in") === true, "citizen.care@gov.in is valid");
assert(validateEmail("invalid-email") === false, "invalid-email is rejected");
assert(validateEmail("user@") === false, "user@ is rejected");
assert(validateEmail("@example.com") === false, "@example.com is rejected");
assert(validateEmail("") === false, "Empty email is rejected");

console.log("\nAll password strength & validation tests passed! 🚀");
