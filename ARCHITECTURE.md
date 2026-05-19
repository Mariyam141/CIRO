# CIRO — System Architecture

## Overview

CIRO is a two-tier system: a **Python AI backend** and a **React Native mobile frontend**.
They communicate over HTTP. The backend runs 5 LLM agents sequentially.
The frontend visualizes each agent's reasoning in real time.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (APK)                             │
│                                                                     │
│  Home ──► Agents ──► Map ──► Actions ──► Stakeholders ──► Logs     │
│                                                                     │
│  Zustand Global Store                                               │
│  ┌─────────────┬──────────────┬──────────────┬───────────────────┐  │
│  │ agentStates │ activeCrises │ agentLogs    │ executionOutput   │  │
│  │ fusionOutput│ allocationOut│ falseAlarm   │ verificationOutput│  │
│  └─────────────┴──────────────┴──────────────┴───────────────────┘  │
│                         │  axios HTTP calls                         │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ localtunnel / WiFi
┌─────────────────────────┼───────────────────────────────────────────┐
│                    FASTAPI BACKEND                                  │
│                                                                     │
│  POST /api/fuse ──────► agents/signal_fusion.py                    │
│  POST /api/detect ─────► agents/crisis_detection.py                │
│  POST /api/allocate ───► agents/resource_allocation.py             │
│  POST /api/execute ────► agents/action_execution.py                │
│  POST /api/verify ─────► agents/verification.py                    │
│  POST /api/stakeholders► (inline in main.py)                       │
│                         │                                           │
│                  agents/utils.py                                    │
│             (shared call_llm + extract_json)                       │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ HTTPS
                    ┌─────┴──────┐
                    │  Groq API  │
                    │ llama-3.3  │
                    │ 70b-vers.  │
                    └────────────┘
```

---

## The 5-Agent Pipeline — Step by Step

### Step 1: Signal Fusion (`/api/fuse`)

**Input**: Raw social media posts, weather snapshot, traffic data  
**What the LLM does**:
- Scores each signal's credibility (0–100) based on source type
  - field_team → 90–99
  - news_outlet/official → 72–92
  - citizen → 45–72
- Detects contradictions between signals (e.g., "flooding" vs "burst pipe")
- Cross-references weather (rainfall mm) and traffic (congestion) to strengthen confidence
- Geo-tags each signal with Karachi coordinates

**Output**: `{ fused_signals[], contradictions_detected[], overall_credibility, reasoning_trace[] }`

---

### Step 2: Crisis Detection (`/api/detect`)

**Input**: The fused signals from Step 1  
**What the LLM does**:
- Clusters signals by geography and type
- Classifies each cluster into a crisis type (urban_flooding, heatwave, industrial_fire, etc.)
- Assigns severity: critical / high / medium / low
- Estimates affected population using Karachi district data
- Predicts duration, peak impact time, spread risk, vulnerable groups

**Output**: `{ crises[{ crisis_id, type, location, coordinates, severity, confidence, affected_population, ... }], reasoning_trace[] }`

---

### Step 3: Resource Allocation (`/api/allocate`)

**Input**: Crisis list from Step 2 + full Karachi resource inventory  
**What the LLM does**:
- Prioritizes crises by severity (critical first)
- Matches resource types to crisis needs (rescue_team for flooding, medical_team for heatwave)
- Estimates ETA based on Karachi district geography
- Documents trade-offs (when a resource can't serve two crises simultaneously)
- Tracks unmet needs honestly

**Output**: `{ allocations[{ crisis_id, assigned_resources[], unmet_needs[], trade_off_note }], resource_utilization, reasoning_trace[] }`

---

### Step 4: Action Execution (`/api/execute`)

**Input**: A specific action to simulate (type, crisis_id, description)  
**What the LLM does**:
- Describes realistic BEFORE state in Karachi context
- Simulates the dispatch sequence (radio contact → mobilization → en route → on site)
- Describes measurable AFTER state
- Computes realistic cost in PKR (Karachi benchmarks)
- Lists side effects (e.g., alternate route congestion)
- Issues a timestamped execution receipt

**Output**: `{ action_id, status, before_state, after_state, execution_time_ms, affected_count, cost_estimate_pkr, receipt_id, side_effects[], reasoning_trace[] }`

---

### Step 5: Verification (`/api/verify`)

**Input**: Original crisis classification + a new contradicting signal  
**What the LLM does**:
- Assigns the new signal to a credibility TIER (1=field_team to 4=unverified citizen)
- Applies decision framework:
  - TIER 1 contradicts original → very likely false alarm
  - TIER 2+ confirms original → confirmed
  - Mixed evidence → conservative (maintain alert)
- Issues verdict: `confirmed`, `false_alarm`, or `reclassified`
- Writes retraction message if false alarm

**Output**: `{ verification_result, confidence, reason, action, retraction_message, reasoning_trace[] }`

---

## Data Flow Diagram

```
User Input (text / Quick Report button)
          │
          ▼
[runDemoSequence() in index.tsx]
          │
          ├──► setAgentState("fusion", "thinking")
          │         │
          │         ▼
          │    POST /api/fuse
          │         │
          │         ▼ fusionData
          ├──► setAgentState("fusion", "done")
          │    setAgentOutput("fusion", { data: fusionData })
          │    setActiveCrises(crises) (after detect)
          │
          ├──► setAgentState("detection", "thinking")
          │         │
          │         ▼
          │    POST /api/detect (passes fusionData)
          │         ▼ detectData
          ├──► setAgentState("detection", "done")
          │
          ├──► [allocation, execution, verification same pattern]
          │
          ▼
   All 5 agents done → CompletionCard shows → Judges explore tabs
```

---

## State Management (Zustand Store)

All agent outputs flow into a single global store (`store/crisisStore.ts`).
Every screen reads from this store — no prop drilling, no repeated API calls.

```
crisisStore
├── agentStates      → drives AgentCard UI (idle/thinking/done/error)
├── agentLogs        → per-agent reasoning trace lines (shown in terminal UI)
├── fusionOutput     → raw fusion agent result
├── detectionOutput  → raw detection agent result
├── allocationOutput → raw allocation result (used by Actions tab)
├── executionOutput  → raw execution result (shown in Actions tab receipt)
├── verificationOutput → raw verification result (shown in Stakeholders)
├── activeCrises     → list of detected crises (used by Map + Actions)
├── executedActions  → list of executed action IDs
├── executionLogs    → structured log entries (shown in Logs tab)
├── falseAlarmDetected → triggers retraction UI in Stakeholders
└── isDemoRunning    → disables buttons while pipeline runs
```

---

## Robustness Design

### JSON Extraction (utils.py)
LLMs sometimes add prose or markdown around their JSON output.
`extract_json()` handles this with a balance-walk algorithm:
1. Strip markdown fences
2. Try direct `json.loads()`
3. Walk the string finding the outermost `{ ... }` block
4. Return the first valid JSON object found

### Retry Logic (utils.py)
If JSON extraction fails on the first LLM call:
1. Re-sends the request with "CRITICAL: Return ONLY raw JSON" appended to both prompts
2. Two attempts total — then raises an exception

### Degraded Mode (index.tsx)
If any backend API call fails (network, Groq rate limit, etc.):
- App catches the error silently
- Substitutes rich pre-built fallback data
- Sets `isDegradedMode: true` (yellow banner)
- Continues the pipeline — agents still go through thinking → done cycle
- Reasoning traces still show, just from fallback data

---

## Mock Data

All input data is simulated. No live APIs are called.

| File | Contents |
|------|---------|
| `scenarios.json` | 4 crisis scenarios with social signals, weather, traffic |
| `resources.json` | 24 Karachi emergency units (rescue teams, ambulances, etc.) |
| `social_feed.json` | 15 social media posts (Roman Urdu + English) |
| `weather_feed.json` | Weather snapshot (rainfall, temperature, wind, alerts) |
| `traffic_feed.json` | 10 Karachi road segments with congestion data |

The LLM is instructed to treat this mock data as real and reason about it genuinely.

---

## API Contract

All endpoints return:
```json
{
  "data": { ... agent-specific output ... },
  "latency_ms": 1240,
  "tokens_used": 1832,
  "timestamp": "2026-05-18T10:23:45Z"
}
```

The frontend accesses `response.data.data` to get the agent output.

---

## Why Groq?

- **Speed**: llama-3.3-70b-versatile responses in 800–2000ms (fastest inference)
- **Quality**: 70B parameter model produces coherent multi-step reasoning
- **Cost**: Free tier covers all demo needs (14,400 req/day)
- **JSON compliance**: Works well with explicit JSON-only system prompts

---

## Karachi-Specific Design Choices

Every agent is given Karachi context:
- **Districts referenced**: Surjani Town, North Karachi, Korangi, Lyari, Gulshan-e-Iqbal, SITE Industrial Area
- **Population figures**: District-level estimates for affected population calculations
- **Road names**: Surjani Road, Northern Bypass, Lyari Expressway, Shahrae Faisal, University Road
- **Hospitals**: Abbasi Shaheed, Jinnah, Civil Hospital, Aga Khan
- **Resources**: Named Karachi units (RT-01 Surjani, MT-01 Abbasi Shaheed, etc.)
- **Cost benchmarks**: PKR estimates for emergency deployments

This specificity makes the LLM reasoning credible and geographically accurate.

---

## Why 5 Agents Instead of 1?

A single agent prompt would produce worse results because:
1. **Context focus**: Each agent only sees relevant prior context, not the entire problem
2. **Specialization**: Each system prompt is tuned for its specific role
3. **Explainability**: Each step's reasoning is independently auditable
4. **Robustness**: A failure in one agent doesn't crash the others
5. **Demonstrability**: Judges can watch each agent's reasoning step by step
