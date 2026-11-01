/**
 * Centralized API Client for FastAPI Backend
 * Handles authentication, status codes, error parsing, multipart uploads, and network timeouts.
 */

import { getApiBaseUrl } from "./config.js";

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.isNetworkError = status === 0;
  }
}

/**
 * Format FastAPI error detail into a human-friendly string.
 */
export function formatErrorDetail(detail, fallbackMsg = "An error occurred") {
  if (!detail) return fallbackMsg;

  if (typeof detail === "string") {
    return detail;
  }

  // FastAPI pydantic validation error array: [{ loc: ['body', 'query'], msg: '...', type: '...' }]
  if (Array.isArray(detail)) {
    const formattedList = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        let field = "";
        if (Array.isArray(item.loc)) {
          const parts = [...item.loc];
          if (parts.length > 1 && (parts[0] === "body" || parts[0] === "query" || parts[0] === "path" || parts[0] === "header")) {
            parts.shift();
          }
          field = parts.join(".");
        }
        const msg = item.msg || "Invalid value";
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean);

    if (formattedList.length > 0) {
      return formattedList.join(" | ");
    }
  }

  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallbackMsg;
    }
  }

  return fallbackMsg;
}

/**
 * Handles clearing invalid auth state upon 401 responses.
 */
function handleAuthFailure() {
  if (typeof window === "undefined") return;

  const wasLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  localStorage.removeItem("access_token");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user_id");

  window.dispatchEvent(new CustomEvent("civic_auth_expired"));

  // If user was logged in and is currently on an app page, redirect to login
  if (wasLoggedIn && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
    window.location.href = "/login";
  }
}

/**
 * Main fetch wrapper
 */
export async function apiClient(endpoint, options = {}) {
  const {
    method = "GET",
    body = null,
    headers = {},
    requiresAuth = true,
    timeoutMs = 25000,
    ...restOptions
  } = options;

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const requestHeaders = {
    "ngrok-skip-browser-warning": "true",
    ...headers,
  };

  // Attach Bearer token if requested & available
  if (requiresAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  // Handle request body
  let requestBody = body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (isFormData) {
    // When sending FormData, let the browser set Content-Type with multipart boundary
    delete requestHeaders["Content-Type"];
  } else if (body && typeof body === "object" && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
      ...restOptions,
    });

    clearTimeout(timeoutId);

    // Parse response body safely
    let responseData = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      try {
        const textData = await response.text();
        responseData = textData;
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      // 401 Unauthorized handling
      if (response.status === 401) {
        handleAuthFailure();
      }

      let parsedMessage = "";
      let errorDetail = null;

      if (responseData && typeof responseData === "object" && "detail" in responseData) {
        errorDetail = responseData.detail;
        parsedMessage = formatErrorDetail(errorDetail);
      } else if (typeof responseData === "string" && responseData.trim()) {
        parsedMessage = responseData;
      } else {
        switch (response.status) {
          case 400:
            parsedMessage = "Invalid request or resource already exists.";
            break;
          case 401:
            parsedMessage = "Authentication required or session expired. Please sign in.";
            break;
          case 403:
            parsedMessage = "You do not have permission to perform this action.";
            break;
          case 404:
            parsedMessage = "The requested resource was not found.";
            break;
          case 413:
            parsedMessage = "The uploaded file is too large.";
            break;
          case 422:
            parsedMessage = "Validation error: please check the submitted form fields.";
            break;
          case 500:
            parsedMessage = "Internal server error. Please try again later.";
            break;
          default:
            parsedMessage = `Request failed with status ${response.status}.`;
        }
      }

      throw new ApiError(parsedMessage, response.status, errorDetail);
    }

    return responseData;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === "AbortError") {
      throw new ApiError(
        `Request to backend timed out after ${Math.round(timeoutMs / 1000)} seconds. Verify backend at ${baseUrl} is reachable.`,
        0
      );
    }

    // Network failure (CORS rejection, server down, invalid LAN IP, host unreachable)
    throw new ApiError(
      `Unable to connect to backend at ${baseUrl}. Ensure backend is running, firewall allows port 8000, and CORS allows your origin.`,
      0
    );
  }
}
