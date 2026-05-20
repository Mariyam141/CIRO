import json
import os
from dotenv import load_dotenv
from agents.runtime_config import get_agent_system_prompt
from agents.utils import call_llm

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DEFAULT_SYSTEM_PROMPT = """You are the Signal Fusion Agent - Step 1 of 5 in the CIRO (Crisis Intelligence \
& Response Orchestrator) agentic pipeline for Karachi, Pakistan.

YOUR ROLE: Ingest raw crisis signals from social media, weather services, and traffic sensors. \
Cross-validate them, assign credibility scores, surface contradictions, and produce a clean \
fused-signal dataset that the Crisis Detection Agent (Step 2) will classify.

LANGUAGE HANDLING - CRITICAL:
  Signals arrive in English, Roman Urdu (Urdu in Latin script), or Urdu (Arabic script).
  You MUST fully understand all three. DO NOT downgrade credibility due to language.
  Key Roman Urdu crisis vocabulary to recognise:
    aag / aag lag gayi / jal raha hai / dhuan  ->  fire / industrial_fire
    pani bhar gaya / barish / baarish / doob   ->  urban_flooding / waterlogging
    garmi / tapish / luu / behosh ho gaya      ->  heatwave / heat_exhaustion
    bijli nahi / light nahi / andhera / load shedding  ->  power_outage
    takkar / hadsa / gaari phas gayi / crash   ->  road_accident
    toot gaya / daraar / pul / deewar giri     ->  structural_collapse / infrastructure_failure
    log phas gaye / nikal nahi sakte / bacha   ->  people trapped; raise severity
    madad karo / help chahiye / emergency      ->  distress; raise severity
    paani ki qillat / paani nahi               ->  water_shortage
  Location extraction from Roman Urdu: "DHA mein" -> DHA Karachi, "Gulshan mein" -> Gulshan-e-Iqbal,
  "SITE pe" -> SITE Industrial Area, "Surjani" -> Surjani Town, "North K" -> North Karachi,
  "Korangi" -> Korangi Industrial Zone, "Lyari" -> Lyari, "Orangi" -> Orangi Town.

CREDIBILITY SCORING RULES (apply strictly):
  field_team / CIRO Field App   ->  90-99  (ground-truth; highest trust)
  official_gov / verified media ->  78-92  (institutional; generally reliable)
  news_outlet (known outlet)    ->  72-88  (professional but may misinterpret)
  verified social accounts      ->  65-80  (blue-tick but no on-ground confirmation)
  citizen (unverified)          ->  45-72  (eye-witness but prone to panic/exaggeration)

PENALISE signals by 5-15 pts for: vague location, extreme emotional language, \
isolated single-source claim with no corroboration, timestamp >2 h ago.

OUTPUT: Return ONLY valid JSON - no markdown, no preamble, no text outside the JSON object."""

SYSTEM_PROMPT = get_agent_system_prompt("signal_fusion", DEFAULT_SYSTEM_PROMPT)


def fuse_signals(payload: dict) -> tuple[dict, int]:
    signal_count = len(payload.get("social_signals", []))
    weather = payload.get("weather_data", {})
    traffic = payload.get("traffic_data", {})

    user_message = f"""Analyze ALL incoming crisis signals for Karachi and produce a fused dataset.

IMPORTANT: Signals may be in Roman Urdu, Urdu script, or English. Treat them all equally - \
understand the crisis type and extract location names regardless of language. \
Roman Urdu is Urdu written phonetically in Latin characters (e.g. "aag lag gayi DHA mein" = fire in DHA).

=== SOCIAL SIGNALS ({signal_count} total) ===
{json.dumps(payload.get("social_signals", []), indent=2)}

=== WEATHER DATA ===
{json.dumps(weather, indent=2)}

=== TRAFFIC DATA ===
{json.dumps(traffic, indent=2)}

Task:
1. Score each social signal's credibility using the rules in your system prompt.
2. Detect any contradictions between signals (e.g., one says flooding, another says burst pipe).
3. Cross-reference weather and traffic to strengthen or weaken social signal confidence.
4. Produce geo-tagged fused signals with Karachi-specific coordinates (lat 24.8-25.1, lng 66.9-67.3).
5. For any Roman Urdu or Urdu signal, note the translated/interpreted meaning in your reasoning_trace.
6. Write a 6-8 step reasoning_trace that references SPECIFIC signal content and explains each decision.

Return this exact JSON structure:
{{
  "fused_signals": [
    {{
      "source": "social_media",
      "credibility_score": 78,
      "location": "Surjani Town, Karachi",
      "coordinates": {{"lat": 24.9801, "lng": 67.0359}},
      "signal_type": "urban_flooding",
      "confidence": 85,
      "flagged": false,
      "flag_reason": null
    }}
  ],
  "contradictions_detected": [
    {{
      "signal_a": "describe signal A",
      "signal_b": "describe signal B",
      "resolution": "explain how you resolved the contradiction"
    }}
  ],
  "overall_credibility": 81,
  "reasoning_trace": [
    "Step 1: Inventoried {signal_count} social signals, weather snapshot, and traffic feed...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ...",
    "Step 6: Computed overall credibility as weighted average of all scored signals."
  ]
}}

If social_signals is empty, generate 5 realistic signals based on a typical Karachi monsoon emergency \
(flooding in Surjani + heatwave in North Karachi). Still reference specific detail in your reasoning_trace."""

    return call_llm(SYSTEM_PROMPT, user_message, agent_key="signal_fusion")
