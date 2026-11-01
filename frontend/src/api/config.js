/**
 * API Configuration Module
 * Uses import.meta.env.VITE_API_BASE_URL with fallback to http://localhost:8000.
 * Supports runtime override via localStorage for seamless two-computer/LAN/tunnel testing.
 * Never logs secrets or private URLs.
 */

const DEFAULT_BASE_URL = "https://hunter-splashy-qualify.ngrok-free.dev/";

export function getApiBaseUrl() {
  const envUrl = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;
  const runtimeOverride = typeof window !== "undefined" ? localStorage.getItem("civic_api_base_url_override") : null;
  const activeUrl = runtimeOverride && runtimeOverride.trim() ? runtimeOverride.trim() : envUrl || DEFAULT_BASE_URL;

  // Strip trailing slashes safely
  return activeUrl.replace(/\/+$/, "");
}

export function setApiBaseUrlOverride(newUrl) {
  if (typeof window === "undefined") return;
  if (!newUrl || !newUrl.trim()) {
    localStorage.removeItem("civic_api_base_url_override");
  } else {
    localStorage.setItem("civic_api_base_url_override", newUrl.trim().replace(/\/+$/, ""));
  }
}

export function clearApiBaseUrlOverride() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("civic_api_base_url_override");
  }
}
