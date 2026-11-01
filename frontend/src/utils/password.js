/**
 * Password & Credentials Validation Utility
 * Enforces strong password rules:
 * - Minimum 8 characters in length
 * - At least 1 uppercase alphabet (A–Z)
 * - At least 1 lowercase alphabet (a–z)
 * - At least 1 digit (0–9)
 * - At least 1 special character (@, #, $, %, &, !, *, etc.)
 */

export const PASSWORD_RULES = [
  {
    id: "length",
    label: "Minimum 8 characters in length",
    test: (pwd) => typeof pwd === "string" && pwd.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least 1 uppercase alphabet (A–Z)",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: "lowercase",
    label: "At least 1 lowercase alphabet (a–z)",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: "digit",
    label: "At least 1 digit (0–9)",
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: "special",
    label: "At least 1 special character (@, #, $, %, etc.)",
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
  },
];

export function validatePassword(password) {
  const pwd = typeof password === "string" ? password : "";
  const results = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(pwd),
  }));
  const isValid = results.every((r) => r.passed);
  return {
    isValid,
    results,
  };
}

export function validateEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
