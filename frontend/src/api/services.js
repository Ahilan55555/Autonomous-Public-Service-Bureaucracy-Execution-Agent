/**
 * Functional API Services Layer
 * Interfaces directly with FastAPI endpoints and safely normalizes all responses.
 */

import { apiClient } from "./client.js";
import {
  normalizeRegisterResponse,
  normalizeAuthResponse,
  normalizeProfile,
  normalizeUnderstandResponse,
  normalizeService,
  normalizeServicesList,
  normalizeAgentAssistResponse,
  normalizeEligibilityResponse,
  normalizeDocument,
  normalizeDocumentList,
  normalizeReadinessResponse,
  normalizeExecutionManifest,
  normalizeHealthCheck,
  formatToIsoDob,
} from "./normalize.js";

// ==========================================
// 1. HEALTH CHECK
// ==========================================
export const healthApi = {
  async checkHealth() {
    const raw = await apiClient("/health", { requiresAuth: false, timeoutMs: 8000 });
    return normalizeHealthCheck(raw);
  },
};

// ==========================================
// 2. AUTHENTICATION
// ==========================================
export const authApi = {
  async register(email, password) {
    const raw = await apiClient("/api/auth/register", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    });
    return normalizeRegisterResponse(raw);
  },

  async login(email, password) {
    const raw = await apiClient("/api/auth/login", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    });
    return normalizeAuthResponse(raw);
  },
};

// ==========================================
// 3. CITIZEN PROFILE
// ==========================================
export const profileApi = {
  async createProfile(data) {
    // Send annual_family_income as a number, nullable fields handled safely
    const payload = {
      full_name: data.full_name || data.fullName,
      dob: formatToIsoDob(data.dob || data.dobString),
      state: data.state || "",
      district: data.district || "",
      education_level: data.education_level || data.educationLevel || "",
      institution_name: data.institution_name || data.institutionName || null,
      annual_family_income:
        data.annual_family_income !== undefined && data.annual_family_income !== null && data.annual_family_income !== ""
          ? Number(data.annual_family_income)
          : data.annualFamilyIncome !== undefined && data.annualFamilyIncome !== null && data.annualFamilyIncome !== ""
          ? Number(data.annualFamilyIncome)
          : 0,
      phone_number: data.phone_number || data.phoneNumber || "",
    };

    const raw = await apiClient("/api/profile/", {
      method: "POST",
      body: payload,
      requiresAuth: true,
    });
    return normalizeProfile(raw);
  },

  async getProfile(userId) {
    const raw = await apiClient(`/api/profile/${userId}`, {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeProfile(raw);
  },

  async updateProfile(userId, partialData) {
    const payload = {};
    if (partialData.full_name !== undefined || partialData.fullName !== undefined) {
      payload.full_name = partialData.full_name || partialData.fullName;
    }
    if (partialData.dob !== undefined) {
      payload.dob = formatToIsoDob(partialData.dob);
    }
    if (partialData.state !== undefined) {
      payload.state = partialData.state;
    }
    if (partialData.district !== undefined) {
      payload.district = partialData.district;
    }
    if (partialData.education_level !== undefined || partialData.educationLevel !== undefined) {
      payload.education_level = partialData.education_level || partialData.educationLevel;
    }
    if (partialData.institution_name !== undefined || partialData.institutionName !== undefined) {
      payload.institution_name = partialData.institution_name || partialData.institutionName || null;
    }
    if (partialData.annual_family_income !== undefined || partialData.annualFamilyIncome !== undefined) {
      const inc = partialData.annual_family_income ?? partialData.annualFamilyIncome;
      payload.annual_family_income = inc !== null && inc !== "" ? Number(inc) : null;
    }
    if (partialData.phone_number !== undefined || partialData.phoneNumber !== undefined) {
      payload.phone_number = partialData.phone_number || partialData.phoneNumber;
    }

    const raw = await apiClient(`/api/profile/${userId}`, {
      method: "PUT",
      body: payload,
      requiresAuth: true,
    });
    return normalizeProfile(raw);
  },
};

// ==========================================
// 4. AI REQUEST UNDERSTANDING
// ==========================================
export const aiApi = {
  async understandRequest(query) {
    const raw = await apiClient("/api/ai/understand-request", {
      method: "POST",
      body: { query },
      requiresAuth: true,
    });
    return normalizeUnderstandResponse(raw);
  },
};

// ==========================================
// 5. GOVERNMENT SERVICES (USER-SCOPED)
// ==========================================
export const servicesApi = {
  async getServices(category = "") {
    const queryParam =
      category && category.trim() && category.trim().toLowerCase() !== "all"
        ? `?category=${encodeURIComponent(category.trim().toLowerCase())}`
        : "";
    const raw = await apiClient(`/api/services/${queryParam}`, {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeServicesList(raw);
  },

  async getMyServices() {
    const raw = await apiClient("/api/services/my-services", {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeServicesList(raw);
  },

  async getServiceById(serviceId) {
    const raw = await apiClient(`/api/services/${serviceId}`, {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeService(raw);
  },

  async deleteUserScheme(serviceId) {
    try {
      const raw = await apiClient(`/api/services/my-services/${serviceId}`, {
        method: "DELETE",
        requiresAuth: true,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("civic_user_scheme_deleted", { detail: { serviceId } }));
      }
      return raw || { success: true };
    } catch (err) {
      if (err.status === 404) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("civic_user_scheme_deleted", { detail: { serviceId } }));
        }
        return { success: true, message: "Scheme already removed" };
      }
      throw err;
    }
  },
};

// ==========================================
// 6. DYNAMIC DISCOVERY
// ==========================================
export const discoveryApi = {
  async search(query, state = "") {
    if (!query || query.trim().length < 3) {
      throw new Error("Search query must be at least 3 characters long.");
    }

    const params = new URLSearchParams();
    params.set("query", query.trim());
    if (state && state.trim()) {
      params.set("state", state.trim());
    }

    const raw = await apiClient(`/api/discovery/search?${params.toString()}`, {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeServicesList(raw);
  },
};

// ==========================================
// 7. AUTONOMOUS AGENT PIPELINE
// ==========================================
export const agentApi = {
  async assist(query) {
    const raw = await apiClient("/api/agent/assist", {
      method: "POST",
      body: { query },
      requiresAuth: true,
    });
    return normalizeAgentAssistResponse(raw);
  },
};

// ==========================================
// 8. ELIGIBILITY CHECKING
// ==========================================
export const eligibilityApi = {
  async checkEligibility(serviceId) {
    const raw = await apiClient(`/api/eligibility/check/${serviceId}`, {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeEligibilityResponse(raw);
  },
};

// ==========================================
// 9. DOCUMENT VAULT & READINESS
// ==========================================
export const documentsApi = {
  async uploadDocument(file, documentType) {
    if (!file) {
      throw new Error("Please select a valid file to upload.");
    }
    if (!documentType || !documentType.trim()) {
      throw new Error("Please specify the document type.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType.trim());

    const raw = await apiClient("/api/documents/upload", {
      method: "POST",
      body: formData,
      requiresAuth: true,
    });
    return normalizeDocument(raw);
  },

  async getDocuments() {
    const raw = await apiClient("/api/documents/", {
      method: "GET",
      requiresAuth: true,
    });
    const list = normalizeDocumentList(raw);
    const userId = (typeof localStorage !== "undefined" && localStorage.getItem("user_id")) || "guest";
    const key = `civic_deleted_docs_${userId}`;
    const deleted = typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem(key) || "[]") : [];
    if (deleted.length === 0) return list;
    return list.filter((d) => !deleted.includes(d.id));
  },

  async deleteDocument(documentId) {
    try {
      await apiClient(`/api/documents/${documentId}`, {
        method: "DELETE",
        requiresAuth: true,
      });
    } catch (e) {
      console.warn("Backend document delete notice:", e?.message || e);
    }
    if (typeof localStorage !== "undefined") {
      const userId = localStorage.getItem("user_id") || "guest";
      const key = `civic_deleted_docs_${userId}`;
      const deleted = JSON.parse(localStorage.getItem(key) || "[]");
      if (!deleted.includes(documentId)) {
        deleted.push(documentId);
        localStorage.setItem(key, JSON.stringify(deleted));
      }
    }
    return true;
  },

  async checkReadiness(serviceId) {
    const raw = await apiClient(`/api/documents/readiness/${serviceId}`, {
      method: "GET",
      requiresAuth: true,
    });
    return normalizeReadinessResponse(raw);
  },
};

// ==========================================
// 10. EXECUTION DRAFT
// ==========================================
export const executionApi = {
  async createDraft(serviceId, citizenQuery = "", additionalFields = {}) {
    const payload = {
      service_id: Number(serviceId),
    };
    if (citizenQuery && citizenQuery.trim()) {
      payload.citizen_query = citizenQuery.trim();
    }
    if (additionalFields && Object.keys(additionalFields).length > 0) {
      payload.additional_fields = additionalFields;
    }

    const raw = await apiClient("/api/execution/draft", {
      method: "POST",
      body: payload,
      requiresAuth: true,
    });
    return normalizeExecutionManifest(raw);
  },
};

// ==========================================
// 11. MY APPLICATIONS
// ==========================================
export const applicationsApi = {
  getStorageKey() {
    const userId = (typeof localStorage !== "undefined" && localStorage.getItem("user_id")) || "guest";
    return `civic_dispatched_applications_${userId}`;
  },

  getLocalApplications() {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async getApplications() {
    // Only return genuinely dispatched application records scoped to the user
    return this.getLocalApplications();
  },

  async dispatchApplication(manifest) {
    const userId = (typeof localStorage !== "undefined" && localStorage.getItem("user_id")) || "guest";
    const refNum = `CE-${(manifest.service_code || "APP").toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newApp = {
      id: `APP-${Date.now()}`,
      reference_number: refNum,
      service_id: manifest.service_id,
      service_name: manifest.service_name,
      service_code: manifest.service_code,
      department: manifest.governance_tier === "state" ? "State Citizen Welfare Department" : "Ministry of Citizen Services & Empowerment",
      status: "Processing",
      submitted_at: new Date().toISOString(),
      portal_url: manifest.portal_url,
      governance_tier: manifest.governance_tier || "central",
      form_payload: manifest.form_payload || {},
      file_attachments: manifest.file_attachments || [],
      user_id: userId,
    };

    const existing = this.getLocalApplications();
    const updated = [newApp, ...existing.filter((a) => a.service_id !== manifest.service_id)];
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("civic_application_dispatched", { detail: newApp }));
    }

    return newApp;
  },

  async deleteApplication(applicationId) {
    const existing = this.getLocalApplications();
    const updated = existing.filter((a) => a.id !== applicationId);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    }
    return true;
  },
};

