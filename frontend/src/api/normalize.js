/**
 * Safe Response Normalization Utilities
 * Ensures defensive fallbacks for missing, null, or undefined fields.
 * Never mutates API response objects.
 */

export function normalizeAuthResponse(data) {
  if (!data || typeof data !== "object") return null;
  return {
    access_token: typeof data.access_token === "string" ? data.access_token : "",
    token_type: typeof data.token_type === "string" ? data.token_type : "bearer",
    user_id: data.user_id !== undefined && data.user_id !== null ? Number(data.user_id) : null,
  };
}

export function normalizeRegisterResponse(data) {
  if (!data || typeof data !== "object") return null;
  return {
    id: data.id !== undefined && data.id !== null ? Number(data.id) : null,
    email: typeof data.email === "string" ? data.email : "",
  };
}

export function formatToDisplayDob(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  const isoPart = str.split("T")[0];
  const parts = isoPart.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return str;
}

export function formatToIsoDob(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const isoPart = str.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
    return isoPart;
  }
  return null;
}

export const BACKEND_CANONICAL_CATEGORIES = [
  "education",
  "transport",
  "social_welfare",
  "civic_service",
  "agriculture",
  "employment",
  "healthcare",
];

export const CANONICAL_CATEGORIES = [
  { id: "all", label: "All Schemes" },
  { id: "education", label: "Education & Scholarships" },
  { id: "transport", label: "Transport" },
  { id: "social_welfare", label: "Social Welfare" },
  { id: "civic_service", label: "Civic Services" },
  { id: "agriculture", label: "Agriculture" },
  { id: "employment", label: "Employment" },
  { id: "healthcare", label: "Healthcare" },
];

export function normalizeCategory(cat) {
  if (!cat || typeof cat !== "string") return "civic_service";
  const lower = cat.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (
    lower === "scholarship" ||
    lower === "scholarships" ||
    lower === "student" ||
    lower === "education" ||
    lower.includes("scholarship") ||
    lower.includes("student")
  ) {
    return "education";
  }
  if (
    lower === "transportation" ||
    lower === "transit" ||
    lower === "transport" ||
    lower.includes("transport")
  ) {
    return "transport";
  }
  if (
    lower === "social" ||
    lower === "welfare" ||
    lower === "social_welfare" ||
    lower.includes("welfare")
  ) {
    return "social_welfare";
  }
  if (
    lower === "civic" ||
    lower === "certificate" ||
    lower === "certificates" ||
    lower === "civic_service" ||
    lower === "civic_services" ||
    lower === "general" ||
    lower.includes("civic")
  ) {
    return "civic_service";
  }
  if (
    lower === "agri" ||
    lower === "farmer" ||
    lower === "farming" ||
    lower === "agriculture" ||
    lower.includes("agr")
  ) {
    return "agriculture";
  }
  if (
    lower === "job" ||
    lower === "jobs" ||
    lower === "employment" ||
    lower.includes("employ")
  ) {
    return "employment";
  }
  if (
    lower === "health" ||
    lower === "medical" ||
    lower === "healthcare" ||
    lower.includes("health")
  ) {
    return "healthcare";
  }
  return lower;
}

export function getCategoryDisplayLabel(category) {
  const norm = normalizeCategory(category);
  const found = CANONICAL_CATEGORIES.find((c) => c.id === norm);
  if (found && found.id !== "all") return found.label;
  return norm
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function deduplicateSchemes(schemes) {
  if (!Array.isArray(schemes)) return [];
  const seenIds = new Set();
  const seenCodes = new Set();
  const seenUrls = new Set();

  return schemes.filter((s) => {
    if (!s || typeof s !== "object") return false;
    if (s.id !== null && s.id !== undefined) {
      if (seenIds.has(s.id)) return false;
      seenIds.add(s.id);
    }
    if (s.service_code && typeof s.service_code === "string" && s.service_code.trim()) {
      const codeKey = s.service_code.trim().toUpperCase();
      if (seenCodes.has(codeKey)) return false;
      seenCodes.add(codeKey);
    }
    if (s.portal_url && typeof s.portal_url === "string" && s.portal_url.trim()) {
      const urlKey = s.portal_url.trim().toLowerCase().replace(/\/+$/, "");
      if (seenUrls.has(urlKey)) return false;
      seenUrls.add(urlKey);
    }
    return true;
  });
}

export function normalizeProfile(data) {
  if (!data || typeof data !== "object") return null;
  const rawDob = typeof data.dob === "string" ? data.dob : null;
  return {
    id: data.id !== undefined && data.id !== null ? Number(data.id) : null,
    user_id: data.user_id !== undefined && data.user_id !== null ? Number(data.user_id) : null,
    full_name: typeof data.full_name === "string" ? data.full_name : "",
    dob: rawDob ? formatToDisplayDob(rawDob) : null,
    dob_iso: rawDob ? formatToIsoDob(rawDob) : null,
    state: typeof data.state === "string" ? data.state : "",
    district: typeof data.district === "string" ? data.district : "",
    education_level: typeof data.education_level === "string" ? data.education_level : "",
    institution_name: typeof data.institution_name === "string" ? data.institution_name : null,
    annual_family_income:
      data.annual_family_income !== undefined && data.annual_family_income !== null
        ? Number(data.annual_family_income)
        : null,
    phone_number: typeof data.phone_number === "string" ? data.phone_number : "",
  };
}

export function normalizeService(data) {
  if (!data || typeof data !== "object") return null;
  const rawCat = typeof data.category === "string" ? data.category : "civic_service";
  const normCat = normalizeCategory(rawCat);

  return {
    id: data.id !== undefined && data.id !== null ? Number(data.id) : null,
    service_code: typeof data.service_code === "string" ? data.service_code : "",
    name: typeof data.name === "string" ? data.name : "Unnamed Service",
    category: normCat,
    category_display: getCategoryDisplayLabel(normCat),
    portal_url: typeof data.portal_url === "string" ? data.portal_url : "",
    description: typeof data.description === "string" ? data.description : "",
    capabilities: Array.isArray(data.capabilities)
      ? data.capabilities
      : typeof data.capabilities === "string" && data.capabilities.trim()
      ? [data.capabilities.trim()]
      : [],
    eligibility_rules: data.eligibility_rules && typeof data.eligibility_rules === "object" ? data.eligibility_rules : {},
    required_documents: Array.isArray(data.required_documents) ? data.required_documents : [],
    eligibility: data.eligibility ? normalizeEligibilityResponse(data.eligibility) : null,
  };
}

export function normalizeServicesList(data) {
  if (!Array.isArray(data)) return [];
  const list = data.map(normalizeService).filter(Boolean);
  return deduplicateSchemes(list);
}

export function normalizeUnderstandResponse(data) {
  if (!data || typeof data !== "object") return null;
  return {
    service_category: typeof data.service_category === "string" ? data.service_category : "",
    service_name: typeof data.service_name === "string" ? data.service_name : "",
    user_type: typeof data.user_type === "string" ? data.user_type : "",
    required_action: typeof data.required_action === "string" ? data.required_action : "",
    missing_information: Array.isArray(data.missing_information) ? data.missing_information : [],
    summary: typeof data.summary === "string" ? data.summary : "",
  };
}

export function normalizeCriterionEvaluation(item) {
  if (!item || typeof item !== "object") return null;
  return {
    criterion: typeof item.criterion === "string" ? item.criterion : "Criterion",
    required: item.required !== undefined && item.required !== null ? String(item.required) : "-",
    actual: item.actual !== undefined && item.actual !== null ? String(item.actual) : "-",
    passed: Boolean(item.passed),
    remarks: typeof item.remarks === "string" ? item.remarks : "",
  };
}

export function normalizeEligibilityResponse(data) {
  if (!data || typeof data !== "object") return null;
  const breakdown = Array.isArray(data.evaluation_breakdown)
    ? data.evaluation_breakdown.map(normalizeCriterionEvaluation).filter(Boolean)
    : [];
  return {
    service_id: data.service_id !== undefined && data.service_id !== null ? Number(data.service_id) : null,
    service_name: typeof data.service_name === "string" ? data.service_name : "Service",
    service_code: typeof data.service_code === "string" ? data.service_code : "",
    is_eligible: Boolean(data.is_eligible),
    evaluation_breakdown: breakdown,
    required_documents_to_prepare: Array.isArray(data.required_documents_to_prepare)
      ? data.required_documents_to_prepare
      : [],
    missing_profile_data: Array.isArray(data.missing_profile_data) ? data.missing_profile_data : [],
    next_action_instructions: typeof data.next_action_instructions === "string" ? data.next_action_instructions : "",
  };
}

export function normalizeEvaluatedScheme(item) {
  if (!item || typeof item !== "object") return null;
  const baseService = normalizeService(item);
  return {
    ...baseService,
    capabilities: Array.isArray(item.capabilities)
      ? item.capabilities
      : typeof item.capabilities === "string" && item.capabilities.trim()
      ? [item.capabilities.trim()]
      : baseService.capabilities || [],
    eligibility: item.eligibility ? normalizeEligibilityResponse(item.eligibility) : null,
  };
}

export function normalizeAgentAssistResponse(data) {
  if (!data || typeof data !== "object") return null;
  const matched = Array.isArray(data.matched_schemes)
    ? data.matched_schemes.map(normalizeEvaluatedScheme).filter(Boolean)
    : [];
  return {
    query: typeof data.query === "string" ? data.query : "",
    citizen_state: typeof data.citizen_state === "string" ? data.citizen_state : "",
    understood_intent: data.understood_intent ? normalizeUnderstandResponse(data.understood_intent) : null,
    matched_schemes: deduplicateSchemes(matched),
  };
}

export function normalizeDocument(data) {
  if (!data || typeof data !== "object") return null;
  return {
    id: data.id !== undefined && data.id !== null ? Number(data.id) : null,
    document_type: typeof data.document_type === "string" ? data.document_type : "Document",
    original_filename: typeof data.original_filename === "string" ? data.original_filename : "unnamed_file",
    mime_type: typeof data.mime_type === "string" ? data.mime_type : "application/octet-stream",
    file_size_bytes: data.file_size_bytes !== undefined && data.file_size_bytes !== null ? Number(data.file_size_bytes) : 0,
    storage_path: typeof data.storage_path === "string" ? data.storage_path : "",
    signed_url: typeof data.signed_url === "string" ? data.signed_url : null,
    created_at: typeof data.created_at === "string" ? data.created_at : "",
  };
}

export function normalizeDocumentList(data) {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeDocument).filter(Boolean);
}

export function normalizeReadinessResponse(data) {
  if (!data || typeof data !== "object") return null;
  const rawPercentage = Number(data.readiness_percentage) || 0;
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage * 10) / 10));

  return {
    service_id: data.service_id !== undefined && data.service_id !== null ? Number(data.service_id) : null,
    service_name: typeof data.service_name === "string" ? data.service_name : "Service",
    total_required_count: Number(data.total_required_count) || 0,
    available_count: Number(data.available_count) || 0,
    readiness_percentage: clampedPercentage,
    satisfied_documents: Array.isArray(data.satisfied_documents) ? data.satisfied_documents : [],
    missing_documents: Array.isArray(data.missing_documents) ? data.missing_documents : [],
    is_ready_for_execution: Boolean(data.is_ready_for_execution),
  };
}

export function normalizeAttachment(item) {
  if (!item || typeof item !== "object") return null;
  return {
    requirement: typeof item.requirement === "string" ? item.requirement : "Required Document",
    filename: typeof item.filename === "string" ? item.filename : "document",
    download_url: typeof item.download_url === "string" ? item.download_url : null,
  };
}

export function normalizeExecutionManifest(data) {
  if (!data || typeof data !== "object") return null;
  return {
    service_id: data.service_id !== undefined && data.service_id !== null ? Number(data.service_id) : null,
    service_name: typeof data.service_name === "string" ? data.service_name : "Service",
    service_code: typeof data.service_code === "string" ? data.service_code : "",
    portal_url: typeof data.portal_url === "string" ? data.portal_url : "",
    governance_tier: typeof data.governance_tier === "string" ? data.governance_tier : "state",
    ready_for_dispatch: Boolean(data.ready_for_dispatch),
    missing_form_fields: Array.isArray(data.missing_form_fields) ? data.missing_form_fields : [],
    missing_documents: Array.isArray(data.missing_documents) ? data.missing_documents : [],
    form_payload: data.form_payload && typeof data.form_payload === "object" ? data.form_payload : {},
    file_attachments: Array.isArray(data.file_attachments)
      ? data.file_attachments.map(normalizeAttachment).filter(Boolean)
      : [],
  };
}

export function normalizeHealthCheck(data) {
  if (!data || typeof data !== "object") return null;
  return {
    status: typeof data.status === "string" ? data.status : "unknown",
    service: typeof data.service === "string" ? data.service : "CivicAgent Backend",
    database: typeof data.database === "string" ? data.database : "unknown",
  };
}
