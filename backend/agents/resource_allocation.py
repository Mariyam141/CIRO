import json
import os
from dotenv import load_dotenv
from agents.utils import call_llm, summarize_resources

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SYSTEM_PROMPT = """You are the Resource Allocation Agent — Step 3 of 5 in the CIRO agentic pipeline \
for Karachi, Pakistan.

YOUR ROLE: Given multiple simultaneous crises and a finite pool of emergency resources, \
allocate units to maximise lives saved. You must reason about severity priority, travel \
time (Karachi road distances), resource type–to–crisis-type fit, and unmet needs.

ALLOCATION PRINCIPLES:
  1. Critical crises always get resources before high/medium/low ones.
  2. Match resource type to crisis need:
       urban_flooding      → rescue_team, water_tanker, ambulance, police_unit
       heatwave            → medical_team, ambulance, water_tanker, shelter
       industrial_fire     → rescue_team, fire_truck, medical_team, police_unit
       road_accident       → ambulance, police_unit, medical_team
       water_shortage      → water_tanker, police_unit (crowd control)
  3. Estimate ETA based on Karachi geography (inner-city: 5–15 min; cross-district: 15–30 min).
  4. Be honest about unmet_needs — do not invent resources not in the available list.
  5. trade_off_note must explain the REAL trade-off (who gets less and why).

OUTPUT: Return ONLY valid JSON — no markdown, no preamble, no text outside the JSON object."""

def allocate_resources(crises_data: dict, resources: dict) -> tuple[dict, int]:
    crises       = crises_data.get("crises", [])
    detect_trace = crises_data.get("reasoning_trace", [])

    # Compact resource summary (avoids token bloat)
    resource_summary = summarize_resources(resources)

    user_message = f"""You have received Crisis Detection Agent's output. Allocate resources optimally.

=== DETECTED CRISES ({len(crises)} total) ===
{json.dumps(crises, indent=2)}

=== DETECTION AGENT REASONING (summary) ===
{json.dumps(detect_trace[:2], indent=2)}

=== AVAILABLE RESOURCES (compact view) ===
{resource_summary}

=== FULL RESOURCE INVENTORY (for unit IDs) ===
{json.dumps(resources, indent=2)}

Your tasks:
1. Rank crises by severity (critical first).
2. For each crisis, assign the most appropriate resource units by ID.
3. Compute realistic ETA_minutes based on Karachi district proximity.
4. Document every trade-off honestly (especially where resources are shared or insufficient).
5. Compute resource_utilization as a percentage: deployed_units / total_units × 100.
6. Write a 6–8 step reasoning_trace referencing specific crisis IDs and resource unit IDs.

Return this exact JSON structure:
{{
  "allocations": [
    {{
      "crisis_id": "C001",
      "crisis_type": "urban_flooding",
      "priority_rank": 1,
      "assigned_resources": [
        {{"type": "rescue_team",  "unit_id": "RT-01", "eta_minutes": 12, "rationale": "Nearest unit to Surjani"}},
        {{"type": "ambulance",    "unit_id": "AM-02", "eta_minutes": 8,  "rationale": "Pre-positioned at Abbasi Shaheed"}}
      ],
      "unmet_needs": ["water_tanker — all 3 units already deployed"],
      "trade_off_note": "Detailed explanation of resource trade-off decision"
    }}
  ],
  "resource_utilization": "87%",
  "reasoning_trace": [
    "Step 1: Received {len(crises)} crises from Crisis Detection Agent...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ...",
    "Step 6: Final utilization — deployed X of Y available units (XX% utilization)."
  ]
}}

Use ONLY unit IDs that appear in the FULL RESOURCE INVENTORY above."""

    return call_llm(SYSTEM_PROMPT, user_message)
