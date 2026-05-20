import json
import os
from datetime import datetime
from dotenv import load_dotenv
from agents.runtime_config import get_agent_system_prompt
from agents.utils import call_llm

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DEFAULT_SYSTEM_PROMPT = """You are the Action Execution Agent - Step 4 of 5 in the CIRO agentic pipeline \
for Karachi, Pakistan.

YOUR ROLE: Simulate realistic execution of a dispatched emergency response action. \
Produce a verifiable execution receipt with before/after state, realistic cost in PKR, \
side effects, and a step-by-step trace of the dispatch sequence.

KARACHI OPERATIONAL CONTEXT:
  - Emergency dispatch centre: Edhi Foundation Control (021-111-369-786)
  - Key hospitals: Abbasi Shaheed, Jinnah Hospital, Civil Hospital, Aga Khan Hospital
  - Key roads: Shahrae Faisal, Northern Bypass, Surjani Road, Lyari Expressway, University Road
  - Cost benchmarks (PKR): rescue_team deployment ~25 000/hr, ambulance run ~8 000,
    water_tanker fill+deploy ~12 000, police_unit ~5 000/hr, shelter setup ~150 000/day
  - Execution time realistic range: rescue_team 1 200-2 500 ms, ambulance 600-1 400 ms,
    water_tanker 800-1 800 ms

OUTPUT: Return ONLY valid JSON - no markdown, no preamble, no text outside the JSON object."""

SYSTEM_PROMPT = get_agent_system_prompt("action_execution", DEFAULT_SYSTEM_PROMPT)


def execute_action(action: dict) -> tuple[dict, int]:
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M")
    action_id = action.get("action_id", "A1")
    action_type = action.get("type", "response")
    crisis_id = action.get("crisis_id", "C001")
    description = action.get("description", "Execute emergency response")

    user_message = f"""Simulate execution of this emergency response action in Karachi.

=== ACTION TO EXECUTE ===
{json.dumps(action, indent=2)}

Your tasks:
1. Describe realistic BEFORE state: exact road/area conditions, civilian situation, resource status.
2. Simulate the dispatch sequence step by step (radio contact, unit mobilisation, en-route, on-site).
3. Describe realistic AFTER state: measurable improvements, lives safeguarded, area status.
4. Compute cost_estimate_pkr using the benchmarks in your system prompt.
5. List any realistic side_effects (e.g., traffic rerouting causing secondary delays).
6. Write a 6-8 step reasoning_trace describing EACH phase of execution with Karachi-specific detail.

Return this exact JSON structure:
{{
  "action_id": "{action_id}",
  "type": "{action_type}",
  "crisis_id": "{crisis_id}",
  "status": "executed",
  "before_state": "Detailed description of situation BEFORE this action in Karachi context",
  "after_state": "Detailed description of situation AFTER this action with specific improvements",
  "execution_time_ms": 1400,
  "affected_count": 2400,
  "cost_estimate_pkr": 85000,
  "receipt_id": "CIRO-{timestamp}-{action_id}",
  "side_effects": [
    "Specific realistic side effect 1",
    "Specific realistic side effect 2"
  ],
  "reasoning_trace": [
    "Step 1: Received dispatch order for {action_type} at {description}...",
    "Step 2: Confirmed unit availability and radio contact established...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ...",
    "Step 6: Receipt CIRO-{timestamp}-{action_id} issued. Execution confirmed."
  ]
}}

execution_time_ms must reflect the action type (see system prompt benchmarks).
affected_count must be realistic for the crisis scale described in the action."""

    return call_llm(SYSTEM_PROMPT, user_message, agent_key="action_execution")
