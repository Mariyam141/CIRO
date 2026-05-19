import json
import os
from dotenv import load_dotenv
from agents.utils import call_llm

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SYSTEM_PROMPT = """You are the Verification Agent — Step 5 of 5 in the CIRO agentic pipeline \
for Karachi, Pakistan.

YOUR ROLE: Receive the original crisis classification and a new contradicting signal. \
Rigorously assess whether the original classification remains valid, needs updating, \
or was a false alarm. If it was a false alarm, generate a retraction alert.

SOURCE CREDIBILITY HIERARCHY (apply when weighing evidence):
  TIER 1 (95–99): field_team with direct on-site observation (CIRO Field App)
  TIER 2 (80–94): official_gov, verified_media with named reporter
  TIER 3 (65–79): news_outlet, verified social account
  TIER 4 (45–64): citizen / unverified social media

DECISION FRAMEWORK:
  - If new signal is TIER 1 and contradicts original → very likely false_alarm or reclassified
  - If new signal is TIER 2+ and confirms original → confirmed, maintain_alert
  - If new signal is TIER 3-4 and contradicts original → evaluate totality; probably confirmed
  - If evidence is mixed → assess balance of evidence; prefer conservative (maintain) unless TIER 1 says otherwise

RETRACTION PROTOCOL (use only for false_alarm):
  - retraction_message must be a broadcast-ready public alert
  - Must name the original location, state what was NOT happening, explain what IS happening
  - Must include "All units stand down from [location]" if resources were deployed

OUTPUT: Return ONLY valid JSON — no markdown, no preamble, no text outside the JSON object."""

def verify_crisis(payload: dict) -> tuple[dict, int]:
    original_crisis = payload.get("original_crisis", {})
    new_signal      = payload.get("new_signal", {})

    original_id   = original_crisis.get("crisis_id", "C001")
    original_type = original_crisis.get("type", "unknown")
    original_loc  = original_crisis.get("location", "unknown location")
    new_source    = new_signal.get("source_type", "unknown")
    new_cred      = new_signal.get("credibility", 70)

    user_message = f"""A contradicting signal has arrived. Verify the original crisis classification.

=== ORIGINAL CRISIS CLASSIFICATION ===
{json.dumps(original_crisis, indent=2)}

=== NEW CONTRADICTING SIGNAL ===
{json.dumps(new_signal, indent=2)}

New signal source: {new_source} (credibility: {new_cred})
Original crisis: {original_type} at {original_loc}

Your tasks:
1. Identify the new signal's TIER (1–4) using the credibility hierarchy.
2. Apply the decision framework to determine the verdict.
3. Provide a specific, evidence-based reason for your decision.
4. If false_alarm: write a broadcast-ready retraction_message.
5. If reclassified: specify the updated crisis type.
6. Write a 6–8 step reasoning_trace that walks through your evidence assessment step by step.

Return this exact JSON structure:
{{
  "original_crisis_id": "{original_id}",
  "verification_result": "confirmed",
  "confidence": 88,
  "reason": "Detailed, specific reason referencing the source credibility and evidence quality",
  "action": "maintain_alert",
  "retraction_message": null,
  "updated_classification": null,
  "reasoning_trace": [
    "Step 1: Original crisis — {original_type} at {original_loc} (classified by Crisis Detection Agent)...",
    "Step 2: New signal from {new_source} (credibility {new_cred}) — assigned TIER X per credibility hierarchy...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ...",
    "Step 6: Verdict: [result]. Action: [action]. Confidence: XX%."
  ]
}}

verification_result must be exactly one of: confirmed | false_alarm | reclassified
action must be exactly one of: maintain_alert | retract_alert | update_alert
retraction_message must be a full broadcast string if false_alarm, otherwise null
updated_classification must be the new crisis type string if reclassified, otherwise null"""

    return call_llm(SYSTEM_PROMPT, user_message)
