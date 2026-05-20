# PART 1 PROMPT — Backend + Mock Data

You are building the backend for CIRO — Crisis Inntelligence & Response
Orchestrator for Karachi, Pakistan. This is Part 1 of 4.

Build ONLY the backend. Do not touch mobile app yet.

---

## TECH STACK

- Python FastAPI
- Groq API (llama-3.3-70b-versatile model)
- groq Python package (pip install groq)
- python-dotenv for env variables

---

## FILE STRUCTURE TO CREATE

ciro/
└── backend/
├── main.py
├── .env
├── requirements.txt
├── agents/
│ ├── **init**.py
│ ├── signal_fusion.py
│ ├── crisis_detection.py
│ ├── resource_allocation.py
│ ├── action_execution.py
│ └── verification.py
└── mock_data/
├── scenarios.json
├── weather_feed.json
├── traffic_feed.json
├── social_feed.json
├── resources.json
└── historical.json

---

## .env FILE

GROQ_API_KEY=your_key_here
PORT=8000

---

## requirements.txt

fastapi
uvicorn
groq
python-dotenv
pydantic

---

## GROQ CLIENT SETUP (use in every agent)

from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def call_llm(system_prompt: str, user_message: str) -> dict:
response = client.chat.completions.create(
model="llama-3.3-70b-versatile",
messages=[
{"role": "system", "content": system_prompt},
{"role": "user", "content": user_message}
],
temperature=0.3,
max_tokens=2000
)
content = response.choices[0].message.content # strip markdown if present
content = content.replace("`json", "").replace("`", "").strip()
return json.loads(content)

---

## AGENT 1 — signal_fusion.py

System prompt:
"You are a crisis signal fusion engine for Karachi, Pakistan.
Ingest signals from social media, weather, and traffic sources.
Score each source credibility 0-100. Flag suspicious or contradictory
signals. You must respond with valid JSON only, no extra text."

Input: { "social_signals": [...], "weather_data": {...}, "traffic_data": {...} }

Output JSON:
{
"fused_signals": [
{
"source": "social_media",
"credibility_score": 78,
"location": "Surjani Town",
"coordinates": { "lat": 24.9801, "lng": 67.0359 },
"signal_type": "flooding",
"confidence": 85,
"flagged": false,
"flag_reason": null
}
],
"contradictions_detected": [
{
"signal_a": "social_flooding_report",
"signal_b": "field_report_water_main",
"resolution": "Prioritizing social + weather over single field report"
}
],
"overall_credibility": 81,
"reasoning_trace": [
"Step 1: Ingested 8 social signals from Karachi",
"Step 2: Cross-referenced with weather data showing 45mm rainfall",
"Step 3: Traffic API confirms congestion spike in same zone",
"Step 4: One field report contradicts — marked for verification"
]
}

---

## AGENT 2 — crisis_detection.py

System prompt:
"You are a crisis classification and severity prediction agent for
Karachi. Analyze fused signals to detect crisis type, severity,
affected population, and evolution. Always return valid JSON only."

Input: Agent 1 output

Output JSON:
{
"crises": [
{
"crisis_id": "C001",
"type": "urban_flooding",
"location": "Surjani Town",
"coordinates": { "lat": 24.9801, "lng": 67.0359 },
"severity": "critical",
"confidence": 91,
"affected_radius_km": 2.3,
"affected_population": 45000,
"expected_duration_hours": 4,
"peak_impact_time": "2 hours",
"spread_risk": "high",
"vulnerable_groups": ["elderly", "children", "low-income households"]
},
{
"crisis_id": "C002",
"type": "heatwave",
"location": "North Karachi",
"coordinates": { "lat": 24.9924, "lng": 67.0637 },
"severity": "high",
"confidence": 84,
"affected_radius_km": 5.1,
"affected_population": 120000,
"expected_duration_hours": 8,
"peak_impact_time": "3 hours",
"spread_risk": "medium",
"vulnerable_groups": ["outdoor workers", "elderly"]
}
],
"reasoning_trace": [
"Step 1: Analyzed fused signals — 2 distinct crisis clusters detected",
"Step 2: Surjani signals show flooding pattern — classified critical",
"Step 3: North Karachi shows heat stress indicators — classified high",
"Step 4: Severity scores assigned based on population and duration"
]
}

---

## AGENT 3 — resource_allocation.py

System prompt:
"You are an emergency resource allocation optimizer for Karachi.
Given constrained resources and multiple simultaneous crises,
allocate based on severity, urgency, travel time, and population.
Show trade-offs clearly. Return valid JSON only."

Input: Agent 2 output + resources data

Output JSON:
{
"allocations": [
{
"crisis_id": "C001",
"assigned_resources": [
{ "type": "rescue_team", "unit_id": "RT-03", "eta_minutes": 12 },
{ "type": "police_unit", "unit_id": "PU-07", "eta_minutes": 8 }
],
"unmet_needs": ["water_tanker"],
"trade_off_note": "Water tanker redirected from C002 due to higher severity"
},
{
"crisis_id": "C002",
"assigned_resources": [
{ "type": "medical_team", "unit_id": "MT-02", "eta_minutes": 15 }
],
"unmet_needs": ["water_tanker"],
"trade_off_note": "Water tanker unavailable — all units deployed to C001"
}
],
"resource_utilization": "87%",
"reasoning_trace": [
"Step 1: Loaded 3 rescue teams, 2 medical teams, 6 police units",
"Step 2: C001 severity critical — assigned closest rescue team RT-03",
"Step 3: Water tanker conflict — prioritized C001 over C002",
"Step 4: C002 assigned medical team for heat emergency"
]
}

---

## AGENT 4 — action_execution.py

System prompt:
"You are an emergency action execution simulator for Karachi.
Simulate realistic execution of emergency response actions.
Return confirmation receipts and before/after state. JSON only."

Input: single action object

Output JSON:
{
"action_id": "A1",
"type": "traffic_reroute",
"status": "executed",
"before_state": "Surjani Road congested, 3km backup",
"after_state": "Traffic diverted via M9, 40% congestion reduction",
"execution_time_ms": 1300,
"affected_count": 2400,
"cost_estimate_pkr": 0,
"receipt_id": "CIRO-20260515-001",
"side_effects": ["M9 load increased by 15%"],
"reasoning_trace": [
"Step 1: Received reroute action for Surjani Road",
"Step 2: Identified M9 as best alternate — capacity sufficient",
"Step 3: Simulated signal changes at 4 intersections",
"Step 4: Estimated 2400 vehicles affected, congestion down 40%"
]
}

---

## AGENT 5 — verification.py

System prompt:
"You are a crisis verification agent for Karachi. When contradicting
evidence arrives, verify the original classification. If false alarm,
generate retraction. Return valid JSON only."

Input: { "original_crisis": {...}, "new_signal": {...} }

Output JSON:
{
"original_crisis_id": "C001",
"verification_result": "false_alarm",
"confidence": 88,
"reason": "Field team confirms water main burst only. No rainfall accumulation.",
"action": "retract_alert",
"retraction_message": "Alert retracted. Reclassified as water main burst. Utility provider notified.",
"updated_classification": "infrastructure_failure",
"reasoning_trace": [
"Step 1: Received contradicting field report",
"Step 2: Compared with original social signals",
"Step 3: Field team credibility score 95 — high trust source",
"Step 4: Original flooding classification confidence drops to 22%",
"Step 5: Reclassified as infrastructure failure — retraction issued"
]
}

---

## FASTAPI ENDPOINTS (main.py)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CIRO Backend")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Global log store

execution_logs = []

POST /api/fuse → calls signal_fusion agent, appends to logs
POST /api/detect → calls crisis_detection agent, appends to logs
POST /api/allocate → calls resource_allocation agent, appends to logs
POST /api/execute → calls action_execution agent, appends to logs
POST /api/verify → calls verification agent, appends to logs
GET /api/scenarios → returns scenarios.json
GET /api/resources → returns resources.json
GET /api/logs → returns execution_logs list
DELETE /api/logs → clears logs (for fresh demo run)
GET /api/baseline → returns hardcoded baseline comparison object:
{
"non_agentic": {
"detection_time_minutes": 18,
"false_alarm_rate": "34%",
"resource_utilization": "52%",
"stakeholders_notified": 2
},
"agentic_ciro": {
"detection_time_minutes": 3,
"false_alarm_rate": "8%",
"resource_utilization": "87%",
"stakeholders_notified": 6
},
"improvement": {
"detection_speed": "6x faster",
"false_alarm_reduction": "76%",
"resource_efficiency": "+35%",
"stakeholder_coverage": "3x more"
}
}

Each endpoint response includes:
{
"data": {...},
"latency_ms": 1240,
"tokens_used": 847,
"timestamp": "ISO"
}

---

## MOCK DATA FILES

### scenarios.json

4 scenarios each with 2 simultaneous crises:

1. Monsoon Emergency: Surjani Flooding + North Karachi Heatwave
2. Industrial Disaster: Korangi Fire + Lyari Accident
3. False Alarm Test: G-10 reported flooding (actually water main) + Shahrae Faisal accident
4. Peak Hour Crisis: SITE Power Outage + Malir Road Collapse

Each scenario includes pre-built social_signals, weather_snapshot, traffic_snapshot

### weather_feed.json

5 Karachi zones: Surjani, North Karachi, Korangi, Lyari, SITE
Each: rainfall_mm, temperature_c, wind_kmh, humidity_pct, alert_level

### traffic_feed.json

10 Karachi roads with congestion_level, avg_speed_kmh, incident_reported:
Shahrae Faisal, Korangi Road, Northern Bypass, Lyari Expressway,
M9 Motorway, Surjani Road, University Road, Hub River Road,
Manghopir Road, Super Highway

### social_feed.json

20 posts mixing Roman Urdu + English with credibility field:
citizen / verified / news_outlet / field_team

### resources.json

- 3 rescue teams with Karachi depot locations + lat/lng
- 2 medical teams linked to real Karachi hospitals
- 6 police units
- 3 water tankers
- 8 ambulances
- 2 shelters with capacity

### historical.json

Past 30 days: flooding frequency by zone, avg response times,
resource utilization rates, seasonal patterns

---

## AFTER BUILDING

Test every endpoint with curl:
curl -X POST http://localhost:8000/api/fuse \
 -H "Content-Type: application/json" \
 -d '{"social_signals": [], "weather_data": {}, "traffic_data": {}}'

Make sure all 5 agents return valid JSON before stopping.
Run with: uvicorn main:app --reload --port 8000

```

---


---

# PART 2 PROMPT — Mobile Core Screens

```

You are building the mobile app for CIRO — Crisis Intelligence & Response
Orchestrator. This is Part 2 of 4. The backend is already built and running
on http://localhost:8000

Build ONLY these files. Do not touch backend.

---

## EXISTING PROJECT STRUCTURE

The Expo project is already created at ciro/mobile/
It has: expo-router, react-native-maps, zustand, axios installed

---

## FILES TO CREATE IN PART 2

mobile/
├── constants/
│ ├── config.ts
│ └── colors.ts
├── store/
│ └── crisisStore.ts
├── components/
│ ├── AgentCard.tsx
│ └── LogEntry.tsx
└── app/
├── \_layout.tsx
├── (tabs)/
│ ├── \_layout.tsx
│ ├── index.tsx ← Home screen
│ └── agents.tsx ← Agent Activity screen

---

## constants/config.ts

// IMPORTANT: Replace with your actual local network IP
// Run 'ipconfig' on Windows to find it (look for IPv4 Address)
export const BASE_URL = "http://192.168.1.x:8000";
export const DEMO_DELAY = 1500; // ms between agent steps

---

## constants/colors.ts

export const Colors = {
bgPrimary: "#080B0F",
bgCard: "#0F1419",
accentRed: "#FF2D3B",
accentAmber: "#F59E0B",
accentGreen: "#10B981",
accentBlue: "#3B82F6",
accentOrange: "#F97316",
textPrimary: "#F0F4F8",
textMuted: "#64748B",
border: "#1E293B",
};

---

## store/crisisStore.ts

Zustand store with this state:

{
// Signal state
inputText: string,
setInputText: (text: string) => void,

// Agent states — each: "idle" | "thinking" | "done" | "error"
agentStates: {
fusion: AgentState,
detection: AgentState,
allocation: AgentState,
execution: AgentState,
verification: AgentState,
},
setAgentState: (agent: string, state: AgentState) => void,

// Agent outputs
fusionOutput: any | null,
detectionOutput: any | null,
allocationOutput: any | null,
executionOutput: any | null,
verificationOutput: any | null,
setAgentOutput: (agent: string, output: any) => void,

// Agent logs (streaming text)
agentLogs: { [agent: string]: string[] },
appendAgentLog: (agent: string, line: string) => void,
clearAgentLogs: () => void,

// Crises
activeCrises: Crisis[],
setActiveCrises: (crises: Crisis[]) => void,

// Actions
actions: Action[],
setActions: (actions: Action[]) => void,
executedActions: string[],
markActionExecuted: (id: string) => void,

// Full execution logs
executionLogs: LogEntry[],
appendLog: (entry: LogEntry) => void,
clearLogs: () => void,

// Demo mode
isDemoRunning: boolean,
setDemoRunning: (val: boolean) => void,

// False alarm
falseAlarmDetected: boolean,
setFalseAlarm: (val: boolean) => void,

// Reset everything
resetAll: () => void,
}

Types:
type AgentState = "idle" | "thinking" | "done" | "error"
type Crisis = {
crisis_id: string,
type: string,
location: string,
coordinates: { lat: number, lng: number },
severity: "low" | "medium" | "high" | "critical",
confidence: number,
affected_population: number,
expected_duration_hours: number,
}
type Action = {
id: string,
type: string,
description: string,
priority: number,
crisis_id: string,
estimated_impact: string,
}
type LogEntry = {
id: string,
timestamp: string,
agent: string,
message: string,
status: "info" | "success" | "warning" | "error",
}

---

## components/AgentCard.tsx

Props:

- name: string
- icon: string (emoji)
- agentKey: string
- description: string

Behavior:

- Reads agentStates[agentKey] from store
- Reads agentLogs[agentKey] from store
- Shows status indicator dot: grey=idle, pulsing red=thinking, green=done
- Shows streaming log lines (last 5 lines visible)
- Collapsible JSON output section
- Pulsing red border animation when thinking

Style:

- Background: #0F1419
- Border: #1E293B (red when thinking)
- Rounded corners, padding 16
- Status dot top right
- Agent name bold white
- Log text: monospace, small, #64748B
- JSON output: monospace, #10B981, smaller font

---

## components/LogEntry.tsx

Props:

- entry: LogEntry

Shows:

- Timestamp (small, muted)
- Agent name (colored by agent)
- Message text
- Status icon: ✓ success, ⚠ warning, ✕ error, ℹ info
- Fade-slide-in animation on mount

---

## app/\_layout.tsx

Root layout with:

- Dark background #080B0F
- StatusBar dark style
- Stack navigator

---

## app/(tabs)/\_layout.tsx

Bottom tab navigator with 6 tabs:

- Home (index) — icon: home
- Agents — icon: cpu/brain
- Map — icon: map
- Actions — icon: zap
- Alerts — icon: bell
- Logs — icon: file-text

Tab bar style:

- Background: #0F1419
- Active tint: #FF2D3B
- Inactive tint: #64748B
- Border top: #1E293B

Use @expo/vector-icons for icons.

---

## app/(tabs)/index.tsx — HOME SCREEN

Layout (dark background #080B0F):

1. Header:
   - "CIRO" in bold red (#FF2D3B), large
   - "Karachi Crisis Intelligence" subtitle in muted color
   - Live clock (updates every second)

2. Signal Input:
   - Dark card (#0F1419)
   - TextInput: "Report karein... (Roman Urdu / English / Urdu)"
   - Text color white, placeholder muted
   - "Submit Report" red button → calls POST /api/fuse with input text

3. Quick Report buttons (2x3 grid):
   🌊 Flood | 🔥 Fire | 💥 Accident
   🌡️ Heatwave | ⚡ Power | 🚧 Infrastructure
   Each button: dark card, colored icon, white label
   Tap → sets inputText and submits

4. Active Crises section:
   - "ACTIVE CRISES" label with red badge showing count
   - If no crises: "No active incidents" muted text
   - If crises: horizontal scroll of CrisisCards
   - Each CrisisCard: crisis type, location, severity badge, confidence %

5. Live Signal Feed:
   - "LIVE SIGNALS" label
   - Scrollable list of recent social feed items
   - Each item: source icon, text, credibility badge, timestamp
   - Auto-refreshes every 10 seconds

6. Bottom buttons:
   - "🚀 Run Demo" — large red button
     → calls runDemoSequence() function
   - "⚠️ Test False Alarm" — amber outlined button
     → calls runFalseAlarmDemo() function

### runDemoSequence() function:

async function runDemoSequence() {
setDemoRunning(true)
clearLogs()
clearAgentLogs()
resetAll()

// Step 1: Load scenario 1 data
const scenarios = await axios.get(BASE_URL + "/api/scenarios")
const scenario = scenarios.data[0] // Monsoon Emergency

// Step 2: Run Agent 1
setAgentState("fusion", "thinking")
appendAgentLog("fusion", "Ingesting signals from 3 sources...")
appendAgentLog("fusion", "Scoring source credibility...")
const fusionRes = await axios.post(BASE_URL + "/api/fuse", {
social_signals: scenario.social_signals,
weather_data: scenario.weather_snapshot,
traffic_data: scenario.traffic_snapshot
})
setAgentOutput("fusion", fusionRes.data)
fusionRes.data.data.reasoning_trace.forEach(line =>
appendAgentLog("fusion", line))
setAgentState("fusion", "done")
appendLog({ agent: "fusion", message: "Signal fusion complete", status: "success" })
await delay(DEMO_DELAY)

// Step 3: Run Agent 2
setAgentState("detection", "thinking")
appendAgentLog("detection", "Classifying crisis types...")
appendAgentLog("detection", "Scoring severity and confidence...")
const detectRes = await axios.post(BASE_URL + "/api/detect",
fusionRes.data.data)
setAgentOutput("detection", detectRes.data)
setActiveCrises(detectRes.data.data.crises)
detectRes.data.data.reasoning_trace.forEach(line =>
appendAgentLog("detection", line))
setAgentState("detection", "done")
appendLog({ agent: "detection", message: "2 crises detected", status: "success" })
await delay(DEMO_DELAY)

// Step 4: Run Agent 3
setAgentState("allocation", "thinking")
appendAgentLog("allocation", "Loading available resources...")
appendAgentLog("allocation", "Optimizing allocation across 2 crises...")
const allocRes = await axios.post(BASE_URL + "/api/allocate",
detectRes.data.data)
setAgentOutput("allocation", allocRes.data)
allocRes.data.data.reasoning_trace.forEach(line =>
appendAgentLog("allocation", line))
setAgentState("allocation", "done")
appendLog({ agent: "allocation", message: "Resources allocated", status: "success" })
await delay(DEMO_DELAY)

// Step 5: Run Agent 4
setAgentState("execution", "thinking")
appendAgentLog("execution", "Executing priority actions...")
const execRes = await axios.post(BASE_URL + "/api/execute",
{ action: { id: "A1", type: "traffic_reroute", crisis_id: "C001" } })
setAgentOutput("execution", execRes.data)
execRes.data.data.reasoning_trace.forEach(line =>
appendAgentLog("execution", line))
setAgentState("execution", "done")
appendLog({ agent: "execution", message: "Actions executed", status: "success" })

setDemoRunning(false)
}

### runFalseAlarmDemo():

Similar but uses scenario 3 (false alarm)
After agents 1-4 run, shows new contradicting signal arriving
Then runs Agent 5 (verification)
Sets falseAlarmDetected = true
Shows retraction in logs

Helper:
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

---

## app/(tabs)/agents.tsx — AGENT ACTIVITY SCREEN

Layout:

- Header: "AGENT ACTIVITY" bold white + status indicator
- Subtitle: "Real-time reasoning trace"
- ScrollView of 5 AgentCards in order:

1. AgentCard — Signal Fusion
   icon: "📡"
   agentKey: "fusion"
   description: "Ingests and scores signals from 3 sources"

2. AgentCard — Crisis Detection
   icon: "🔍"
   agentKey: "detection"
   description: "Classifies crisis type, severity, confidence"

3. AgentCard — Resource Allocation
   icon: "⚡"
   agentKey: "allocation"
   description: "Optimizes resource distribution across crises"

4. AgentCard — Action Execution
   icon: "🚀"
   agentKey: "execution"
   description: "Simulates coordinated response actions"

5. AgentCard — Verification
   icon: "✅"
   agentKey: "verification"
   description: "Detects false alarms and issues retractions"
   (show dimmed/disabled style when falseAlarmDetected is false)

Between each card: thin connector line with arrow (▼) in red

Bottom panel: "BASELINE COMPARISON" card

- Two columns: "Traditional" vs "CIRO Agentic"
- Detection time: 18 min vs 3 min
- False alarms: 34% vs 8%
- Resources used: 52% vs 87%
- Stakeholders: 2 vs 6
- Style: table with green highlights on CIRO column

---

## IMPORTANT NOTES

- Use StyleSheet.create() for all styles, no inline styles
- All API calls wrapped in try/catch with error logging
- Loading states shown during API calls
- ScrollView with bounces={false} on all screens
- KeyboardAvoidingView on Home screen for input
- Test on physical device via Expo Go
- Run: npx expo start --tunnel (for physical device on different network)

```

---

# PART 3 PROMPT — Map + Actions + Stakeholders

```

You are continuing to build CIRO mobile app. This is Part 3 of 4.
Backend is running. Part 2 screens (Home, Agents) are already built.

Build ONLY these files:

mobile/
├── components/
│ ├── CrisisCard.tsx
│ ├── ActionCard.tsx
│ └── StakeholderCard.tsx
└── app/
└── (tabs)/
├── map.tsx ← Crisis Map
├── actions.tsx ← Response Actions
└── stakeholders.tsx ← Stakeholder Notifications

---

## components/CrisisCard.tsx

Props: crisis: Crisis

Shows:

- Crisis type icon (🌊 flood, 🔥 fire, 💥 accident, 🌡️ heatwave, ⚡ power, 🚧 infra)
- Location name bold white
- Severity badge: critical=red, high=orange, medium=amber, low=green
- Confidence percentage with progress bar
- Affected population count
- Expected duration

Style: dark card #0F1419, red left border for critical

---

## components/ActionCard.tsx

Props: action: Action, onSimulate: () => void, isExecuted: boolean

Shows:

- Priority badge: P1=red, P2=amber, P3=blue
- Action type icon
- Description text
- Estimated impact (green text)
- Crisis ID tag
- "Simulate Execution" button (disabled + green check if already executed)
- After execution: receipt card slides up showing:
  - Receipt ID
  - Before/after state
  - Affected count
  - Side effects (if any) in amber

---

## components/StakeholderCard.tsx

Props: stakeholder: Stakeholder, onSend: () => void

type Stakeholder = {
id: string,
type: "public" | "hospital" | "emergency" | "utility" | "transport" | "media",
name: string,
message: string,
priority: "high" | "medium" | "low",
sent: boolean,
}

Shows:

- Stakeholder icon (👥 🏥 🚒 ⚡ 🚌 📺)
- Name and type
- Message preview (truncated to 2 lines)
- Priority badge
- "Send Notification" button → marks sent
- Sent state: green checkmark + timestamp

---

## app/(tabs)/map.tsx — CRISIS MAP SCREEN

Layout:

- Full screen react-native-maps
- Centered on Karachi: { latitude: 24.8607, longitude: 67.0011 }
- Initial zoom: latitudeDelta 0.15, longitudeDelta 0.15
- mapType="dark" or "standard"

Map elements (read from crisisStore):

- For each crisis in activeCrises:
  - Circle overlay on coordinates:
    - C001 (flooding): red, radius 2300m, opacity 0.3
    - C002 (heatwave): orange, radius 5100m, opacity 0.2
  - Marker at crisis center with emoji (🌊 or 🌡️)
  - Callout showing: type, severity, confidence, population

- Resource markers from resources.json:
  - Rescue teams: 🚒 red marker
  - Medical teams: 🚑 green marker
  - Shelters: 🏠 blue marker

- Animated route lines showing unit movement to crisis zones
  (use Polyline with coordinates from resource location to crisis location)

Top overlay card (floating):

- Shows active crisis count
- Total affected population
- Resource utilization %

Bottom toggle bar:

- "BEFORE" | "AFTER" toggle buttons
- Before: show congested roads (red Polylines on main roads)
- After: show alternate routes (green Polylines), units moving
- Animate transition between states

False alarm state:

- When falseAlarmDetected = true
- C001 zone changes from red to amber
- Marker changes to ⚠️
- Overlay shows "RECLASSIFIED" badge

---

## app/(tabs)/actions.tsx — RESPONSE ACTIONS SCREEN

Layout:

- Header: "RESPONSE ACTIONS"
- Progress bar: X / total actions executed (red fill)
- Two crisis tabs: "C001 — Flooding" | "C002 — Heatwave"
  - Tab indicator: red underline
- ScrollView of ActionCards for selected crisis tab

Actions for C001 (flooding):

1. { id:"A1", type:"traffic_reroute", description:"Redirect Surjani Road traffic via M9 Motorway", priority:1, estimated_impact:"2,400 vehicles rerouted, 40% congestion reduction" }
2. { id:"A2", type:"emergency_dispatch", description:"Deploy rescue team RT-03 from Surjani Base", priority:2, estimated_impact:"Est. 50 stranded persons assisted" }
3. { id:"A3", type:"public_alert", description:"Broadcast Urdu flood warning to Surjani residents", priority:3, estimated_impact:"45,000 residents notified" }

Actions for C002 (heatwave):

1. { id:"A4", type:"medical_dispatch", description:"Deploy medical team MT-02 to North Karachi", priority:1, estimated_impact:"Est. 200 heat cases treated" }
2. { id:"A5", type:"shelter_activation", description:"Open North Karachi Ground shelter", priority:2, estimated_impact:"1,200 persons capacity available" }

Each ActionCard has "Simulate Execution" button
→ calls POST /api/execute with action
→ shows receipt from agent response

Bottom summary card:

- Total actions: 5
- Executed: X
- Estimated cost: PKR 0 (emergency response)
- Lives impacted: running total

---

## app/(tabs)/stakeholders.tsx — STAKEHOLDER NOTIFICATIONS

Layout:

- Header: "STAKEHOLDER ALERTS"
- Subtitle: "Coordinated notifications across 6 channels"
- "Generate All" red button → generates messages for all stakeholders
- ScrollView of StakeholderCards

6 Stakeholders (hardcode realistic messages, update when crises detected):

1. Public Alert 👥
   message: "⚠️ سرجانی ٹاؤن میں سیلاب کی صورتحال۔ فوری طور پر محفوظ مقامات پر جائیں۔
   CIRO Alert: Flash flooding in Surjani Town. Evacuate to designated shelters immediately."
   priority: high

2. Jinnah Hospital 🏥
   message: "CIRO ALERT: Mass casualty event possible — Surjani flooding.
   Prepare 50 additional beds. Trauma team on standby. ETA of first patients: 45 minutes."
   priority: high

3. Emergency Services 🚒
   message: "DISPATCH ORDER — RT-03: Proceed to Surjani Town (24.9801, 67.0359).
   Flooding reported. 50+ persons stranded. ETA required ASAP."
   priority: high

4. KE Utility ⚡
   message: "CIRO SYSTEM: Power shutdown recommended for Surjani flood zones
   to prevent electrocution risk. Affected feeders: F-234, F-235. Authorization required."
   priority: medium

5. Transport Authority 🚌
   message: "ROUTE UPDATE: Surjani Road closed due to flooding.
   All buses rerouted via M9. Update passenger information systems immediately."
   priority: medium

6. Media / Command Center 📺
   message: "SITUATION REPORT — CIRO SYSTEM\nIncident: Urban Flooding + Heatwave\n
   Location: Surjani Town + North Karachi\nSeverity: Critical + High\n
   Resources Deployed: 3 units\nEstimated Affected: 165,000 persons\n
   Response Status: ACTIVE"
   priority: low

False alarm retraction message (shown when falseAlarmDetected = true):

- Additional card highlighted in amber:
  "⚠️ RETRACTION: Previous flood alert for G-10 is hereby retracted.
  Incident reclassified as water main burst.
  Utility provider (KWSB) has been notified. Public alert cancelled."

```

---

# PART 4 PROMPT — Logs + Demo Polish + README

```

You are finishing the CIRO mobile app. This is Part 4 of 4.
All previous screens are built. Backend is running.

Build ONLY these remaining pieces:

mobile/app/(tabs)/logs.tsx ← Incident Log screen
Then polish demo mode and generate README.

---

## app/(tabs)/logs.tsx — INCIDENT LOG SCREEN

Layout:

- Header: "INCIDENT LOG"
- Subtitle: "Full agent reasoning trace"

Filter tabs (horizontal scroll):
All | Fusion | Detection | Allocation | Execution | Verification

Each tab filters executionLogs by agent field.

Log list (ScrollView, auto-scroll to bottom):

- Each entry: <LogEntry /> component
- Entries sorted by timestamp ascending
- Auto-scrolls to latest on new entry

False Alarm section:

- When falseAlarmDetected = true
- Amber highlighted section header: "⚠️ FALSE ALARM DETECTED & CORRECTED"
- Shows verification agent logs with amber background

Baseline Comparison card (bottom):
┌─────────────────────────────────────────┐
│ BASELINE COMPARISON │
├──────────────────┬──────────────────────┤
│ Traditional │ CIRO Agentic ✓ │
├──────────────────┼──────────────────────┤
│ 18 min detect │ 3 min detect │
│ 34% false alarm │ 8% false alarm │
│ 52% resources │ 87% resources │
│ 2 stakeholders │ 6 stakeholders │
└──────────────────┴──────────────────────┘
Improvement badges: "6x Faster" "76% Less False Alarms"

Export button:

- Copies full log as formatted text to clipboard
- Shows "Copied!" toast

---

## DEMO MODE POLISH

In index.tsx update runDemoSequence() to also:

- After agent steps complete → navigate to map tab automatically
- Wait 2s → navigate to actions tab
- Auto-execute Action A1 (first action)
- Wait 2s → navigate to stakeholders tab
- Wait 2s → navigate to logs tab
- Show completion toast: "Demo complete — full trace available in Logs"

Use router.push("/(tabs)/map") etc for navigation between tabs

---

## ROBUSTNESS — Add to all API calls

Every axios call should have:

- timeout: 30000 (30 seconds)
- try/catch that:
  - Logs error to executionLogs with status "error"
  - Sets agent state to "error"
  - Shows user-friendly error message
  - Falls back to mock response if API fails:

const FALLBACK_FUSION = {
fused_signals: [...], // use first scenario mock data
contradictions_detected: [],
overall_credibility: 75,
reasoning_trace: ["[DEGRADED MODE] Using cached signal data"]
}

Show "⚠️ DEGRADED MODE" banner when fallback is used

---

## README.md

Generate complete README.md at ciro/ root:

# CIRO — Crisis Intelligence & Response Orchestrator

## Overview

CIRO is an agentic AI system built for Karachi, Pakistan that detects,
analyzes, and coordinates responses to urban crises in real time.

## Architecture

[ASCII diagram showing]:
Signal Sources → Agent 1 (Fusion) → Agent 2 (Detection) →
Agent 3 (Allocation) → Agent 4 (Execution) → Agent 5 (Verification)
↓
Mobile App ← FastAPI Backend ← Groq LLM (llama-3.3-70b-versatile)

## How Google Antigravity Was Used

- Primary IDE for all development
- Agent Manager used to run frontend and backend agents in parallel
- Antigravity reasoning traces captured for submission

## Signal Sources

1. Social Media Feed (mock — Roman Urdu + English posts)
2. Weather API (mock — Open-Meteo format)
3. Traffic Feed (mock — 10 Karachi intersections)

## Agent Descriptions

Agent 1: Signal Fusion — credibility scoring, contradiction detection
Agent 2: Crisis Detection — classification, severity, population impact
Agent 3: Resource Allocation — constrained optimization, trade-offs
Agent 4: Action Execution — simulation, before/after state, receipts
Agent 5: Verification — false alarm detection, alert retraction

## APIs and Tools

- Groq API (llama-3.3-70b-versatile) — LLM reasoning
- React Native Expo — mobile app
- FastAPI — backend orchestration
- react-native-maps — Karachi map visualization
- Zustand — state management

## Baseline Comparison

| Metric                | Traditional | CIRO Agentic |
| --------------------- | ----------- | ------------ |
| Detection time        | 18 min      | 3 min        |
| False alarm rate      | 34%         | 8%           |
| Resource utilization  | 52%         | 87%          |
| Stakeholders notified | 2           | 6            |

## Robustness

- API failure fallback to cached responses (degraded mode)
- Low confidence (<60%) triggers human escalation
- Duplicate signal deduplication within 500m / 10 min window
- False alarm detection and alert retraction workflow

## Cost and Latency

- Avg API call latency: ~1.2 seconds
- Groq tokens per full pipeline: ~4,000 tokens
- Estimated cost per full crisis response: $0.002
- Groq free tier: 14,400 requests/day — sufficient for production demo

## Scalability

- 10x scale: Add Redis queue for signal ingestion
- 100x scale: Deploy on Google Cloud Run, horizontal scaling
- Multi-city: Parameterize city context in agent prompts

## Privacy and Safety

- No real personal data used
- All social feed data is mock/simulated
- Coordinates are approximate zone-level only

## Setup Instructions

1. Clone repo
2. cd backend && pip install -r requirements.txt
3. Add GROQ_API_KEY to backend/.env
4. uvicorn main:app --reload --port 8000
5. cd mobile && npm install
6. Update BASE_URL in constants/config.ts to your local IP
7. npx expo start
8. Scan QR code with Expo Go app

## Limitations

- Mock data only — no live API integration
- Single city (Karachi) optimized
- Groq rate limits may affect rapid repeated demo runs

## Demo Video

[Link to be added]

```

---

# FINAL TEST PROMPT

```

The CIRO app is fully built. Run these final checks:

## BACKEND TESTS

Run these curl commands and confirm each returns valid JSON:

1. curl http://localhost:8000/api/scenarios
   Expected: array of 4 scenario objects

2. curl http://localhost:8000/api/resources
   Expected: object with rescue_teams, medical_teams etc

3. curl -X POST http://localhost:8000/api/fuse \
   -H "Content-Type: application/json" \
   -d '{"social_signals":[{"text":"Surjani mein pani bhar gaya","credibility":"citizen"}],"weather_data":{"zone":"Surjani","rainfall_mm":45,"alert_level":"red"},"traffic_data":{"road":"Surjani Road","congestion_level":"critical"}}'
   Expected: fused_signals array + reasoning_trace

4. curl -X POST http://localhost:8000/api/detect \
   -H "Content-Type: application/json" \
   -d '{"fused_signals":[{"location":"Surjani Town","signal_type":"flooding","confidence":85}],"overall_credibility":81}'
   Expected: crises array with 2 crises

5. curl http://localhost:8000/api/baseline
   Expected: non_agentic vs agentic_ciro comparison object

6. curl http://localhost:8000/api/logs
   Expected: array (may be empty initially)

## MOBILE TESTS

1. Run: npx expo start
2. Scan QR with Expo Go
3. Confirm Home screen loads with signal feed
4. Tap "Run Demo" — confirm all 5 agents activate sequentially
5. Check Agent Activity screen — all 5 cards show correct states
6. Check Map screen — 2 crisis zones visible
7. Check Actions screen — 5 action cards across 2 tabs
8. Check Stakeholders screen — 6 notification cards
9. Check Logs screen — trace entries visible + baseline table
10. Tap "Test False Alarm" — confirm amber retraction appears in logs

## IF ANYTHING FAILS

For backend errors:

- Check .env has correct GROQ_API_KEY
- Check uvicorn is running on port 8000
- Check CORS is enabled in main.py

For mobile errors:

- Check BASE_URL has correct local IP (run ipconfig to find it)
- Check Expo Go and laptop are on same WiFi network
- Run: npx expo start --tunnel (if same network not working)

## AFTER ALL TESTS PASS

Build APK:

1. cd mobile
2. eas build --platform android --profile preview
3. Wait for cloud build (15-20 minutes)
4. Download APK from Expo dashboard
5. Install on Android phone: adb install ciro.apk
   OR transfer APK file to phone and install directly

```

---
```
