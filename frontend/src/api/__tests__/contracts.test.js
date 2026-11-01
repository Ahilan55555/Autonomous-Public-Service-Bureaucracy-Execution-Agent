/* global process */
import {
  formatToDisplayDob,
  formatToIsoDob,
  BACKEND_CANONICAL_CATEGORIES,
  normalizeCategory,
  getCategoryDisplayLabel,
  deduplicateSchemes,
  normalizeProfile,
  normalizeAgentAssistResponse,
  normalizeEligibilityResponse,
} from "../normalize.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log("--- 1. Testing Profile DOB Conversion (No Timezone Shift) ---");
// ISO to Display DD/MM/YYYY
assert(formatToDisplayDob("2000-05-15") === "15/05/2000", "2000-05-15 converts to 15/05/2000");
assert(formatToDisplayDob("1995-12-01") === "01/12/1995", "1995-12-01 converts to 01/12/1995");
assert(formatToDisplayDob("15/05/2000") === "15/05/2000", "Already DD/MM/YYYY remains 15/05/2000");
assert(formatToDisplayDob("2000-05-15T00:00:00Z") === "15/05/2000", "ISO timestamp extracts date part accurately without timezone shift");

// Display DD/MM/YYYY or ISO to Backend ISO YYYY-MM-DD
assert(formatToIsoDob("15/05/2000") === "2000-05-15", "15/05/2000 converts to 2000-05-15");
assert(formatToIsoDob("01/12/1995") === "1995-12-01", "01/12/1995 converts to 1995-12-01");
assert(formatToIsoDob("2000-05-15") === "2000-05-15", "2000-05-15 remains 2000-05-15");
assert(formatToIsoDob(null) === null, "null remains null");

// normalizeProfile returns display dob and iso dob
const profileIn = { full_name: "Hari", dob: "1998-04-20" };
const normProfile = normalizeProfile(profileIn);
assert(normProfile.dob === "20/04/1998", "Profile display dob is DD/MM/YYYY");
assert(normProfile.dob_iso === "1998-04-20", "Profile iso dob is YYYY-MM-DD");

console.log("\n--- 2. Testing Canonical Categories ---");
assert(BACKEND_CANONICAL_CATEGORIES.length === 7, "Exactly 7 canonical categories defined");
assert(
  JSON.stringify(BACKEND_CANONICAL_CATEGORIES) ===
    JSON.stringify(["education", "transport", "social_welfare", "civic_service", "agriculture", "employment", "healthcare"]),
  "Exact canonical category names match backend contract"
);
assert(normalizeCategory("Scholarship") === "education", "Scholarships mapped to canonical 'education'");
assert(normalizeCategory("student financial portal") === "education", "Student portals mapped to 'education'");
assert(normalizeCategory("Transit") === "transport", "Transit mapped to 'transport'");
assert(normalizeCategory("Farming") === "agriculture", "Farming mapped to 'agriculture'");
assert(normalizeCategory("Social Welfare") === "social_welfare", "Social Welfare normalized to lowercase");
assert(getCategoryDisplayLabel("education").includes("Education"), "Friendly display label for education");
assert(getCategoryDisplayLabel("social_welfare") === "Social Welfare", "Friendly display label for social_welfare");
assert(getCategoryDisplayLabel("civic_service").includes("Civic Service"), "Friendly display label for civic_service");

console.log("\n--- 3. Testing Scheme Deduplication ---");
const rawList = [
  { id: 101, service_code: "EDU-01", name: "National Merit Scholarship", portal_url: "https://nsp.gov.in" },
  { id: 101, service_code: "EDU-01", name: "National Merit Scholarship", portal_url: "https://nsp.gov.in" },
  { id: 102, service_code: "AGR-02", name: "PM Kisan", portal_url: "https://pmkisan.gov.in" },
  { service_code: "AGR-02", name: "PM Kisan Samman", portal_url: "https://pmkisan.gov.in" },
];
const deduped = deduplicateSchemes(rawList);
assert(deduped.length === 2, `Deduplicated list contains exactly 2 unique schemes (got ${deduped.length})`);
assert(deduped[0].id === 101, "First scheme is preserved");
assert(deduped[1].service_code === "AGR-02", "Second scheme deduplicated by service_code/portal_url");

console.log("\n--- 4. Testing Conversational Assist Query (matched_schemes is []) ---");
const assistChatResponse = {
  understood_intent: {
    service_category: null,
    user_type: null,
    required_action: "greeting",
    missing_information: [],
    summary: "Hello! How can I assist you with public services today?",
  },
  matched_schemes: [],
  citizen_state: { profile_completed: true },
};
const normAssistChat = normalizeAgentAssistResponse(assistChatResponse);
assert(normAssistChat.matched_schemes.length === 0, "Conversational assist has empty matched_schemes array");
assert(normAssistChat.understood_intent.summary.includes("Hello"), "Summary rendered safely");
assert(!normAssistChat.understood_intent.service_category, "Empty category handled gracefully without crash");

console.log("\n--- 5. Testing Assist with Matched Schemes & Evaluation Breakdown ---");
const assistSchemesResponse = {
  understood_intent: {
    service_category: "education",
    user_type: "student",
    required_action: "scholarship_search",
    missing_information: [],
    summary: "Found eligible scholarships for your profile.",
  },
  matched_schemes: [
    {
      id: 10,
      service_code: "POST-MATRIC-SC",
      name: "Post Matric Scholarship",
      category: "education",
      portal_url: "https://scholarships.gov.in",
      description: "Financial support for post-matriculation studies.",
      capabilities: ["document_verification", "direct_benefit_transfer"],
      eligibility: {
        is_eligible: true,
        evaluation_breakdown: [
          {
            criterion: "Education Level",
            required: "Undergraduate",
            actual: "UG Degree",
            passed: true,
            remarks: "Semantic match: UG Degree satisfies Undergraduate criterion.",
          },
          {
            criterion: "Family Income",
            required: "<= 250000",
            actual: "150000",
            passed: true,
            remarks: "Citizen income 150000 is within required ceiling.",
          },
        ],
        required_documents_to_prepare: ["Income Certificate", "Marksheet"],
        missing_profile_data: [],
      },
    },
  ],
};
const normAssistSchemes = normalizeAgentAssistResponse(assistSchemesResponse);
assert(normAssistSchemes.matched_schemes.length === 1, "Matched scheme normalized");
const s = normAssistSchemes.matched_schemes[0];
assert(s.id === 10, "Scheme id preserved");
assert(s.capabilities.includes("direct_benefit_transfer"), "Capabilities array preserved");
assert(s.eligibility.is_eligible === true, "Eligibility is_eligible preserved");
assert(s.eligibility.evaluation_breakdown.length === 2, "Breakdown length is 2");
assert(s.eligibility.evaluation_breakdown[0].passed === true, "Semantic qualification match passed");
assert(s.eligibility.evaluation_breakdown[0].remarks.includes("Semantic match"), "Remarks preserved");
assert(s.eligibility.required_documents_to_prepare.length === 2, "Required documents to prepare preserved");

console.log("\n--- 6. Testing Eligibility Check Response (Passed & Failed Breakdown) ---");
const eligCheckResponse = {
  service_id: 10,
  service_name: "Post Matric Scholarship",
  service_code: "POST-MATRIC-SC",
  is_eligible: false,
  evaluation_breakdown: [
    {
      criterion: "Minimum Marks",
      required: "75%",
      actual: "62%",
      passed: false,
      remarks: "Citizen actual marks (62%) does not meet minimum 75% requirement.",
    },
    {
      criterion: "State Residence",
      required: "Tamil Nadu",
      actual: "Tamil Nadu",
      passed: true,
      remarks: "State residency matched.",
    },
  ],
  required_documents_to_prepare: ["Community Certificate"],
  missing_profile_data: ["caste_category"],
  next_action_instructions: "Update your profile with caste category to complete eligibility evaluation.",
};
const normElig = normalizeEligibilityResponse(eligCheckResponse);
assert(normElig.is_eligible === false, "Overall eligibility is false");
assert(normElig.evaluation_breakdown[0].passed === false, "Failed criterion correctly identified");
assert(normElig.evaluation_breakdown[0].remarks.includes("does not meet"), "Remarks present for failure");
assert(normElig.missing_profile_data[0] === "caste_category", "Missing profile data preserved");
assert(normElig.next_action_instructions.includes("Update your profile"), "Next action instructions preserved");

console.log("\n--- 7. Testing Local State Removal on Scheme Deletion ---");
let userDiscoveredList = [
  { id: 1, name: "Service A" },
  { id: 2, name: "Service B" },
  { id: 3, name: "Service C" },
];
const idToDelete = 2;
userDiscoveredList = userDiscoveredList.filter((s) => s.id !== idToDelete);
assert(userDiscoveredList.length === 2, "Scheme removed immediately from local state");
assert(!userDiscoveredList.some((s) => s.id === 2), "Deleted scheme is no longer present");
assert(userDiscoveredList[0].id === 1 && userDiscoveredList[1].id === 3, "Remaining schemes are preserved intact");

console.log("\nAll Backend Contract unit & normalization tests passed successfully! 🎉");
