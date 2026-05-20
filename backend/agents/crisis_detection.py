import json
import os
from dotenv import load_dotenv
from agents.runtime_config import get_agent_system_prompt
from agents.utils import call_llm

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DEFAULT_SYSTEM_PROMPT = """You are the Crisis Detection Agent - Step 2 of 5 in the CIRO agentic pipeline \
for Karachi, Pakistan.

YOUR ROLE: Receive the fused-signal dataset produced by the Signal Fusion Agent and classify every \
distinct crisis it represents. For each crisis, determine type, severity, affected population, \
geographic spread, timeline, and vulnerable groups.

LANGUAGE AWARENESS: The Signal Fusion Agent may have processed Roman Urdu or Urdu signals. \
The fused_signals you receive will already have extracted signal_type and location, but the \
original text field may still be in Roman Urdu or Urdu. Trust the fusion agent's classification \
and use the signal_type field - do not be confused by non-English text in the "source" descriptions.

CRISIS TYPES (use exact strings):
  urban_flooding | heatwave | industrial_fire | road_accident | water_shortage |
  structural_collapse | civil_unrest | disease_outbreak | power_outage | cyclone_warning

SEVERITY LEVELS (use exact strings - be conservative; avoid over-calling critical):
  critical  ->  immediate threat to life, >10 000 affected, rapid spread likely
  high      ->  serious harm within hours, 1 000-10 000 affected
  medium    ->  manageable with standard response, <1 000 affected
  low       ->  monitoring only, no immediate harm

KARACHI POPULATION REFERENCE (for affected estimates):
  Surjani Town ~400 K | North Karachi ~600 K | Korangi ~500 K | Lyari ~700 K |
  Gulshan-e-Iqbal ~350 K | SITE Industrial ~100 K workers | Shah Faisal Colony ~300 K

OUTPUT: Return ONLY valid JSON - no markdown, no preamble, no text outside the JSON object."""

SYSTEM_PROMPT = get_agent_system_prompt("crisis_detection", DEFAULT_SYSTEM_PROMPT)


def detect_crises(fused_signals: dict) -> tuple[dict, int]:
    signal_list = fused_signals.get("fused_signals", [])
    contradictions = fused_signals.get("contradictions_detected", [])
    overall_cred = fused_signals.get("overall_credibility", 75)
    fusion_trace = fused_signals.get("reasoning_trace", [])

    user_message = f"""You have received the Signal Fusion Agent's output. Classify ALL distinct crises.

=== FUSED SIGNALS ({len(signal_list)} signals, overall credibility {overall_cred}%) ===
{json.dumps(signal_list, indent=2)}

=== CONTRADICTIONS DETECTED BY FUSION AGENT ===
{json.dumps(contradictions, indent=2)}

=== FUSION AGENT REASONING SUMMARY ===
{json.dumps(fusion_trace[:3], indent=2)}

Your tasks:
1. Group signals by geographic cluster and crisis type.
2. Assign severity using the guide in your system prompt - justify with signal evidence.
3. Estimate affected_population from Karachi district population reference.
4. Estimate expected_duration_hours and peak_impact_time based on crisis type + weather context.
5. Identify spread_risk (high/medium/low) and list vulnerable_groups.
6. Write a 6-8 step reasoning_trace that explains EACH classification decision with evidence.

Return this exact JSON structure (include ALL distinct crises found):
{{
  "crises": [
    {{
      "crisis_id": "C001",
      "type": "urban_flooding",
      "location": "Surjani Town, Karachi",
      "coordinates": {{"lat": 24.9801, "lng": 67.0359}},
      "severity": "critical",
      "confidence": 91,
      "affected_radius_km": 2.3,
      "affected_population": 45000,
      "expected_duration_hours": 4,
      "peak_impact_time": "within 2 hours",
      "spread_risk": "high",
      "vulnerable_groups": ["elderly", "children", "low-income households"]
    }}
  ],
  "reasoning_trace": [
    "Step 1: Received {len(signal_list)} fused signals from Signal Fusion Agent...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ...",
    "Step 6: Final classification - identified N distinct crises requiring immediate response."
  ]
}}

Minimum 1 crisis, maximum 4. confidence must be 0-100 (integer)."""

    return call_llm(SYSTEM_PROMPT, user_message, agent_key="crisis_detection")
