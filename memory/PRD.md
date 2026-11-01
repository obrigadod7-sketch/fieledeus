# PRD - fieledeus (Watizat)
## Problem
Make the GitHub repo chat (/api/ai/chat) work with OpenRouter + Groq keys.
## Done (2026-06)
- Imported repo into /app; /api/ai/chat now tries OpenRouter -> Groq -> OpenAI with fallback
- Defaults: OPENROUTER_MODEL=google/gemma-4-31b-it:free, GROQ_MODEL=openai/gpt-oss-120b
- Verified via curl + UI (answered through Groq)
## Backlog
- OpenRouter blocked (no credits / free-model privacy policy)
- Render markdown in chat replies; answers cut at 1000 tokens
## Fix (2026-06)
- JobsPage white screen: restored missing SERVICE_CATEGORIES / SEARCH_SUGGESTIONS / JOB_PLATFORMS and the Platforms/Offers/Seekers tab views
- Map: real Google Map via REACT_APP_GOOGLE_MAPS_API_KEY (GoogleMapComponent wired into MapPage, SVG fallback without key)
- Backlog: RAPIDAPI_KEY missing (external job search 503); French job boards get "Brasil" as location
