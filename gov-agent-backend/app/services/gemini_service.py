import logging
from app.schemas.ai import ServiceIntentResponse
from app.schemas.agent_pipeline import ServiceIntentResult
from app.services.gemini_base import gemini_fast_client

logger = logging.getLogger("agent.pipeline")

INTENT_SYSTEM_PROMPT = """
You are an expert Government Bureaucracy and Public Service AI Intent Classifier.
Analyze the citizen's query and extract their true public service intent.

RULES:
1. Accurately assign service_category (e.g. grievance, education, civic_infrastructure, social_welfare, agriculture, disaster_management).
2. Determine specific service_name (e.g. flood_relief_subsidy, road_damage_complaint).
3. Identify citizen's user_type and missing_information.
4. Keep the summary concise and strictly factual.

CONVERSATIONAL & GREETING HANDLING:
- If the citizen's query is a greeting, casual check-in, polite pleasantry, or meta-question
  (e.g., "Hi", "How are you", "What can you do?"):
  1. Set service_category to "general".
  2. Set service_name to "general_inquiry".
  3. Set required_action to "respond_to_greeting".
  4. Set missing_information to [].
  5. Phrase summary as a direct, first-person, friendly reply to the citizen, not a
     third-person classification note. Acknowledge the message and ask how you can help
     with public schemes, scholarships, licensing, or grievances.
"""


class GeminiService:
    async def understand_request(self, query: str) -> ServiceIntentResponse:
        result: ServiceIntentResult = await gemini_fast_client.execute_structured_query(
            task_name="IntentExtraction",
            prompt=f"Classify this citizen request: '{query}'",
            system_instruction=INTENT_SYSTEM_PROMPT,
            schema=ServiceIntentResult
        )

        if result:
            return ServiceIntentResponse(
                service_category=result.service_category,
                service_name=result.service_name,
                user_type=result.user_type,
                required_action=result.required_action,
                missing_information=result.missing_information,
                summary=result.summary
            )

        # Dynamic fallback if all external models are unavailable
        q = query.lower()
        is_flood = "flood" in q or "rain" in q or "disaster" in q
        return ServiceIntentResponse(
            service_category="social_welfare" if is_flood else "civic",
            service_name="flood_relief_assistance" if is_flood else "general_service",
            user_type="citizen",
            required_action="apply_for_relief" if is_flood else "clarify_request",
            missing_information=["exact_location", "extent_of_damage"],
            summary=f"Automated intent extraction: {query}"
        )


gemini_service = GeminiService()