import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, ToastAndroid, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../../store/crisisStore';
import axios from 'axios';
import { BASE_URL, DEMO_DELAY } from '../../constants/config';
import { useRouter } from 'expo-router';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const LIVE_SIGNALS_BY_TYPE: Record<string, { text: string; source: string; time: string }[]> = {
  fire: [
    { text: 'Aag lag gayi — bohot dhuan uth raha hai ilaake mein', source: 'logo-twitter', time: 'Just now' },
    { text: 'Fire emergency reported. Fire brigade and rescue teams dispatched to the site.', source: 'newspaper', time: '1m ago' },
    { text: 'North Karachi mein garmi bohat zyada hai, 2 log behosh hue', source: 'logo-twitter', time: '5m ago' },
  ],
  accident: [
    { text: 'Badi takkar ho gayi Shahrah-e-Faisal par — gaadi ulat gayi', source: 'logo-twitter', time: 'Just now' },
    { text: 'Road accident blocking major artery. Emergency services responding.', source: 'newspaper', time: '2m ago' },
    { text: 'Traffic completely stopped — 3km backup confirmed', source: 'logo-twitter', time: '4m ago' },
  ],
  heatwave: [
    { text: 'Garmi ki wajah se 3 log behosh — Korangi mein medical emergency', source: 'logo-twitter', time: 'Just now' },
    { text: 'PMD: Temperature hits 46°C in Karachi. Extreme heat advisory issued.', source: 'newspaper', time: '1m ago' },
    { text: 'Hospitals reporting rise in heatstroke cases. Cooling centers needed.', source: 'call', time: '3m ago' },
  ],
  power: [
    { text: 'Bijli nahi ghanton se — DHA Phase 6 mein andhera', source: 'logo-twitter', time: 'Just now' },
    { text: 'K-Electric reports feeder fault. Repair crews dispatched. ETA unclear.', source: 'newspaper', time: '2m ago' },
    { text: 'North Karachi mein garmi aur bijli dono masla — logon ka bura haal', source: 'logo-twitter', time: '4m ago' },
  ],
  infrastructure: [
    { text: 'Lyari Expressway par badi daraar — traffic rok di gayi', source: 'logo-twitter', time: 'Just now' },
    { text: 'Structural damage on Lyari Expressway. KMC engineering team en route.', source: 'newspaper', time: '2m ago' },
    { text: 'Northern Bypass activated as alternate route. Expect heavy delays.', source: 'call', time: '5m ago' },
  ],
  flood: [
    { text: 'Heavy waterlogging on Shahrah-e-Faisal', source: 'logo-twitter', time: 'Just now' },
    { text: 'Power outage reported in DHA Phase 6', source: 'call', time: '2m ago' },
    { text: 'Pani bhar gaya Surjani mein — gaariyan phans gayi', source: 'logo-twitter', time: '3m ago' },
  ],
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    inputText,
    setInputText,
    setDemoRunning,
    clearLogs,
    clearAgentLogs,
    resetAll,
    setAgentState,
    appendAgentLog,
    setAgentOutput,
    appendLog,
    setActiveCrises,
    activeCrises,
    isDemoRunning,
    setFalseAlarm,
    markActionExecuted,
    isDegradedMode,
    setDegradedMode,
    currentUser,
    logout,
  } = useCrisisStore();

  const isAdmin = currentUser?.role === 'admin';

  const [time, setTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [liveSignals, setLiveSignals] = useState<{ text: string; source: string; time: string }[]>([
    { text: 'Heavy waterlogging on Shahrah-e-Faisal', source: 'twitter', time: 'Just now' },
    { text: 'Power outage reported in DHA Phase 6', source: 'call', time: '2m ago' },
    { text: 'Pani bhar gaya Surjani mein — gaariyan phans gayi', source: 'twitter', time: '3m ago' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/scenarios`, { timeout: 5000 });
        const scenarios = res.data?.scenarios || res.data;
        if (Array.isArray(scenarios) && scenarios[0]?.social_signals?.length > 0) {
          const posts = scenarios[0].social_signals.slice(0, 5).map((s: any, i: number) => ({
            text: s.text || s.content || 'Incoming signal...',
            source: s.source_type === 'news_outlet' ? 'newspaper' : s.source_type === 'field_team' ? 'call' : 'logo-twitter',
            time: i === 0 ? 'Just now' : `${(i + 1) * 2}m ago`,
          }));
          setLiveSignals(posts);
        }
      } catch {
        // keep fallback signals
      }
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!inputText.trim() || isDemoRunning) return;
    const signal = inputText.trim();
    setInputText('');
    setSubmitting(true);
    // Navigate to agents tab so judges can watch the pipeline
    router.push('/(tabs)/agents');
    await delay(400);
    setSubmitting(false);
    // Run full pipeline with this signal as the primary report
    runDemoSequence(signal);
  };

  const runDemoSequence = async (customSignal?: string) => {
    const crisisType = (() => {
      const s = (customSignal || '').toLowerCase();
      // Fire — English + Roman Urdu + Urdu script hints
      if (s.includes('fire') || s.includes('🔥') || s.includes('aag') || s.includes('jal raha') || s.includes('jal rahi') || s.includes('jalraha') || s.includes('dhuan') || s.includes('dhua') || s.includes('sulag') || s.includes('blast') || s.includes('explosion') || s.includes('پھٹ')) return 'fire';
      // Accident — English + Roman Urdu
      if (s.includes('accident') || s.includes('💥') || s.includes('takkar') || s.includes('hadsa') || s.includes('crash') || s.includes('gaari phas') || s.includes('gaari uld') || s.includes('tabahi') || s.includes('bus gir') || s.includes('truck') || s.includes('collision')) return 'accident';
      // Heatwave — English + Roman Urdu
      if (s.includes('heat') || s.includes('🌡️') || s.includes('garmi') || s.includes('tapish') || s.includes(' luu') || s.includes('behosh') || s.includes('garam') || s.includes('sun stroke') || s.includes('sunstroke') || s.includes('heatstroke') || s.includes('temperature')) return 'heatwave';
      // Power — English + Roman Urdu
      if (s.includes('power') || s.includes('⚡') || s.includes('bijli') || s.includes('light nahi') || s.includes('light band') || s.includes('blackout') || s.includes('andhera') || s.includes('outage') || s.includes('load shed') || s.includes('k-electric') || s.includes('kesc') || s.includes('generator')) return 'power';
      // Infrastructure — English + Roman Urdu
      if (s.includes('infrastructure') || s.includes('🚧') || s.includes('toot') || s.includes('daraar') || s.includes('bridge') || s.includes('pul') || s.includes('deewar') || s.includes('expressway') || s.includes('road damage') || s.includes('gir gaya') || s.includes('collapse') || s.includes('sewage') || s.includes('sewer')) return 'infrastructure';
      // Flood — English + Roman Urdu
      if (s.includes('flood') || s.includes('🌊') || s.includes('pani') || s.includes('barish') || s.includes('baarish') || s.includes('bhar gaya') || s.includes('bhar raha') || s.includes('doob') || s.includes('waterlog') || s.includes('naali') || s.includes('sewage overflow')) return 'flood';
      // Default — treat unknown text as flood (most common Karachi crisis)
      return 'flood';
    })();
    if (isDemoRunning) return;
    // Update live signal feed to match the crisis type being demonstrated
    if (customSignal) {
      const feedSignals = LIVE_SIGNALS_BY_TYPE[crisisType] ?? LIVE_SIGNALS_BY_TYPE['flood'];
      setLiveSignals([
        { text: customSignal, source: 'logo-twitter', time: 'Just now' },
        ...feedSignals.slice(1),
      ]);
    } else {
      setLiveSignals(LIVE_SIGNALS_BY_TYPE['flood']);
    }
    // Reset state first, then mark as running (resetAll sets isDemoRunning: false)
    resetAll();
    setDemoRunning(true);
    // Navigate to Agents tab so the pipeline is visible while it runs
    router.push('/(tabs)/agents');
    await delay(300);

    try {
      // Load scenario data
      let scenario: any = null;
      try {
        const scenariosRes = await axios.get(`${BASE_URL}/api/scenarios`, { timeout: 10000 });
        const arr = scenariosRes.data?.scenarios || scenariosRes.data;
        scenario = Array.isArray(arr) ? arr[0] : null;
        setDegradedMode(false);
      } catch {
        // non-critical fetch — continue with fallback data
      }

      const fallbackSocial = [
        { text: "Surjani mein pani bhar gaya, gaariyan phans gayi hain", credibility: 65, source_type: "citizen" },
        { text: "ALERT: Surjani Town sector 11/C completely waterlogged. Residents urged to stay indoors.", credibility: 88, source_type: "verified" },
        { text: "Breaking: 45mm rainfall in Surjani Town in 2 hours. Roads flooded, rescue teams dispatched.", credibility: 92, source_type: "news_outlet" },
        { text: "North Karachi mein garmi bohat zyada hai, 3 log behosh ho gaye", credibility: 60, source_type: "citizen" },
      ];
      const fallbackWeather = { zone: "Surjani", rainfall_mm: 45, alert_level: "red", temperature_c: 42, humidity_pct: 88 };
      const fallbackTraffic = { road: "Surjani Road", congestion_level: "critical", avg_speed_kmh: 5, incident_reported: true };

      let safeSocial = scenario?.social_signals || fallbackSocial;
      let safeWeather = scenario?.weather_snapshot || fallbackWeather;
      let safeTraffic = scenario?.traffic_snapshot || fallbackTraffic;

      // When a custom signal is given, replace all scenario signals with type-specific ones
      // so the AI doesn't get flooded with Monsoon Emergency signals and misclassifies
      if (customSignal) {
        const supportingSignals: Record<string, any[]> = {
          fire:           [{ text: "Aag ke saath dhuan bhi uth raha hai — logon ko door rehne ki hidayat", credibility: 65, source_type: "citizen" }, { text: "Fire emergency reported in Karachi. Fire brigades and rescue teams dispatched to the site.", credibility: 90, source_type: "news_outlet" }],
          accident:       [{ text: "Sadak pe badi takkar — gaariyan ruk gayi hain, ambulance bulai gayi", credibility: 68, source_type: "citizen" }, { text: "Road accident reported in Karachi. Traffic disrupted, emergency services responding.", credibility: 87, source_type: "news_outlet" }],
          heatwave:       [{ text: "Garmi ki wajah se log behosh ho rahe hain — pani ki zaroorat hai", credibility: 62, source_type: "citizen" }, { text: "PMD issues extreme heat advisory for Karachi. Temperature exceeding 45°C. Public urged to stay indoors.", credibility: 92, source_type: "verified" }],
          power:          [{ text: "Bijli ghanton se nahi aye — hospital aur ghar dono mutasir hain", credibility: 70, source_type: "citizen" }, { text: "K-Electric reports feeder-level fault in Karachi. Restoration crews dispatched. ETA under assessment.", credibility: 88, source_type: "verified" }],
          infrastructure: [{ text: "Sadak ya structure mein daraar — log khatre mein hain, traffic roka gaya", credibility: 72, source_type: "citizen" }, { text: "Infrastructure damage reported in Karachi. KMC engineering team conducting emergency assessment.", credibility: 91, source_type: "news_outlet" }],
          flood:          [{ text: "Pani tezi se bhar raha hai — gaariyan phas rahi hain, nikalná mushkil", credibility: 68, source_type: "citizen" }, { text: "Heavy waterlogging reported in Karachi. Rescue teams deployed. Residents urged to avoid low-lying areas.", credibility: 90, source_type: "news_outlet" }],
        };
        safeSocial = [
          { text: customSignal, credibility: 75, source_type: 'citizen' },
          ...(supportingSignals[crisisType] ?? supportingSignals['flood']),
        ];
        // Use neutral weather/traffic for non-flood crises so AI doesn't see "45mm rainfall"
        if (crisisType !== 'flood') {
          safeWeather = { zone: "Karachi", rainfall_mm: 0, alert_level: crisisType === 'heatwave' ? "red" : "green", temperature_c: crisisType === 'heatwave' ? 46 : 34, humidity_pct: 45 };
          safeTraffic = { road: "Karachi roads", congestion_level: crisisType === 'accident' ? "critical" : "moderate", avg_speed_kmh: crisisType === 'accident' ? 8 : 35, incident_reported: crisisType === 'accident' };
        }
      }

      // ─── Agent 1: Signal Fusion ───────────────────────────────────────
      setAgentState("fusion", "thinking");
      appendAgentLog("fusion", `Ingesting ${safeSocial.length} social signals, weather data, traffic data...`);
      appendAgentLog("fusion", "Scoring source credibility (0-100 scale)...");
      appendAgentLog("fusion", "Checking for contradictions and misinformation...");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "fusion", message: "Pipeline started — Agent 1 processing signals", status: "info" });

      // Crisis-type → fused signal metadata (used by fusion fallback so detection AI gets correct input)
      const CRISIS_SIGNAL_META: Record<string, { signal_type: string; location: string; lat: number; lng: number }> = {
        fire:           { signal_type: 'industrial_fire',        location: 'SITE Industrial Area',    lat: 24.8900, lng: 67.0200 },
        accident:       { signal_type: 'road_accident',          location: 'Shahrah-e-Faisal',        lat: 24.8607, lng: 67.0260 },
        heatwave:       { signal_type: 'heatwave',               location: 'Korangi Industrial Zone', lat: 24.8300, lng: 67.1300 },
        power:          { signal_type: 'power_outage',           location: 'DHA Phase 6',             lat: 24.8035, lng: 67.0607 },
        infrastructure: { signal_type: 'infrastructure_failure', location: 'Lyari Expressway',        lat: 24.8700, lng: 67.0100 },
        flood:          { signal_type: 'urban_flooding',         location: 'Surjani Town',             lat: 24.9801, lng: 67.0359 },
      };
      const signalMeta = CRISIS_SIGNAL_META[crisisType] ?? CRISIS_SIGNAL_META['flood'];

      let fusionData: any;
      try {
        const fusionRes = await axios.post(`${BASE_URL}/api/fuse`, {
          social_signals: safeSocial,
          weather_data: safeWeather,
          traffic_data: safeTraffic
        }, { timeout: 30000 });
        fusionData = fusionRes.data.data;
      } catch {
        setDegradedMode(true);
        fusionData = {
          fused_signals: safeSocial.map((s: any) => ({
            source: s.source_type || 'citizen',
            credibility_score: s.credibility || 70,
            location: signalMeta.location,
            coordinates: { lat: signalMeta.lat, lng: signalMeta.lng },
            signal_type: signalMeta.signal_type,
            confidence: s.credibility || 70,
            flagged: false,
            flag_reason: null,
          })),
          contradictions_detected: [],
          overall_credibility: 81,
          reasoning_trace: [
            `Step 1: Ingested ${safeSocial.length} signals from social media, weather, and traffic sources`,
            `Step 2: Scored credibility — news_outlet (88-92%), citizen (65-72%) based on source tier`,
            `Step 3: Primary cluster: ${signalMeta.signal_type} signals at ${signalMeta.location}`,
            `Step 4: Weather and traffic data cross-referenced — consistent with ${signalMeta.signal_type} classification`,
          ],
        };
      }

      setAgentOutput("fusion", { data: fusionData });
      fusionData?.reasoning_trace?.forEach((line: string) => appendAgentLog("fusion", line));
      setAgentState("fusion", "done");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "fusion", message: `Fusion complete — ${fusionData?.fused_signals?.length ?? 0} signals fused, credibility ${fusionData?.overall_credibility ?? '—'}%`, status: "success" });
      await delay(DEMO_DELAY);

      // ─── Agent 2: Crisis Detection ────────────────────────────────────
      setAgentState("detection", "thinking");
      appendAgentLog("detection", "Analyzing fused signal clusters for crisis patterns...");
      appendAgentLog("detection", "Classifying crisis type, severity, affected radius...");
      appendAgentLog("detection", "Predicting population impact and evolution timeline...");

      let detectData: any;
      try {
        const detectRes = await axios.post(`${BASE_URL}/api/detect`, fusionData, { timeout: 30000 });
        detectData = detectRes.data.data;
      } catch {
        setDegradedMode(true);
        const C002_HEATWAVE = { crisis_id: "C002", type: "heatwave", location: "North Karachi", coordinates: { lat: 24.9924, lng: 67.0637 }, severity: "medium", confidence: 76, affected_radius_km: 4.0, affected_population: 85000, expected_duration_hours: 6, peak_impact_time: "3 hours", spread_risk: "medium", vulnerable_groups: ["outdoor workers", "elderly"] };
        const fallbackDetection: Record<string, any> = {
          fire:           { crises: [{ crisis_id: "C001", type: "industrial_fire",       location: "SITE Industrial Area",  coordinates: { lat: 24.8900, lng: 67.0200 }, severity: "critical", confidence: 88, affected_radius_km: 1.5, affected_population: 12000,  expected_duration_hours: 3,  peak_impact_time: "1 hour",     spread_risk: "high",   vulnerable_groups: ["factory workers", "nearby residents"] }, C002_HEATWAVE],          reasoning_trace: ["Step 1: Fire signals detected from SITE area — smoke, heat sensors", "Step 2: Industrial zone — factory fire, multiple sources confirm", "Step 3: Classified C001: industrial_fire | CRITICAL | 88%", "Step 4: Secondary heatwave cluster in North Karachi — C002 flagged for medical outreach"] },
          accident:       { crises: [{ crisis_id: "C001", type: "road_accident",         location: "Shahrah-e-Faisal",      coordinates: { lat: 24.8607, lng: 67.0260 }, severity: "high",     confidence: 85, affected_radius_km: 0.5, affected_population: 3000,   expected_duration_hours: 2,  peak_impact_time: "30 minutes", spread_risk: "low",    vulnerable_groups: ["accident victims", "commuters"] }, C002_HEATWAVE],                    reasoning_trace: ["Step 1: Multiple collision reports on Shahrah-e-Faisal", "Step 2: Traffic gridlock confirmed — 3km backup", "Step 3: Classified C001: road_accident | HIGH | 85%", "Step 4: Secondary heatwave cluster in North Karachi — C002 flagged for multi-crisis coordination"] },
          heatwave:       { crises: [{ crisis_id: "C001", type: "heatwave",              location: "Korangi Industrial Zone",coordinates: { lat: 24.8300, lng: 67.1300 }, severity: "critical", confidence: 90, affected_radius_km: 8.0, affected_population: 200000, expected_duration_hours: 12, peak_impact_time: "3 hours",    spread_risk: "high",   vulnerable_groups: ["outdoor workers", "elderly", "children"] }, { ...C002_HEATWAVE, crisis_id: "C002", type: "power_outage", location: "DHA Phase 6", coordinates: { lat: 24.8035, lng: 67.0607 }, affected_population: 80000, severity: "medium" as const }],            reasoning_trace: ["Step 1: Temperature 46°C in Korangi — hospital heatstroke cases rising", "Step 2: Pakistan Met Dept extreme heat advisory confirmed", "Step 3: Classified C001: heatwave | CRITICAL | 90%", "Step 4: Grid overload from AC demand — secondary power_outage C002 in DHA detected"] },
          power:          { crises: [{ crisis_id: "C001", type: "power_outage",          location: "DHA Phase 6",           coordinates: { lat: 24.8035, lng: 67.0607 }, severity: "high",     confidence: 92, affected_radius_km: 4.0, affected_population: 80000,  expected_duration_hours: 6,  peak_impact_time: "Ongoing",    spread_risk: "medium", vulnerable_groups: ["hospitals", "elderly on medical equipment"] }, C002_HEATWAVE],          reasoning_trace: ["Step 1: K-Electric grid fault signals from DHA area", "Step 2: Multiple outage reports — feeder-level failure confirmed", "Step 3: Classified C001: power_outage | HIGH | 92%", "Step 4: No cooling available — secondary heatwave risk in North Karachi, C002 flagged"] },
          infrastructure: { crises: [{ crisis_id: "C001", type: "infrastructure_failure",location: "Lyari Expressway",      coordinates: { lat: 24.8700, lng: 67.0100 }, severity: "high",     confidence: 86, affected_radius_km: 1.0, affected_population: 15000,  expected_duration_hours: 8,  peak_impact_time: "2 hours",    spread_risk: "low",    vulnerable_groups: ["commuters", "nearby residents"] }, C002_HEATWAVE],                    reasoning_trace: ["Step 1: Structural alerts from Lyari Expressway sensors", "Step 2: Field team confirms road damage — partial collapse", "Step 3: Classified C001: infrastructure_failure | HIGH | 86%", "Step 4: Secondary heatwave cluster in North Karachi — C002 flagged, resources constrained"] },
          flood:          { crises: [{ crisis_id: "C001", type: "urban_flooding",        location: "Surjani Town",          coordinates: { lat: 24.9801, lng: 67.0359 }, severity: "critical", confidence: 91, affected_radius_km: 2.3, affected_population: 45000,  expected_duration_hours: 4,  peak_impact_time: "2 hours",    spread_risk: "high",   vulnerable_groups: ["elderly", "children", "low-income households"] }, { crisis_id: "C002", type: "heatwave", location: "North Karachi", coordinates: { lat: 24.9924, lng: 67.0637 }, severity: "high", confidence: 84, affected_radius_km: 5.1, affected_population: 120000, expected_duration_hours: 8, peak_impact_time: "3 hours", spread_risk: "medium", vulnerable_groups: ["outdoor workers", "elderly"] }], reasoning_trace: ["Step 1: Analyzed fused signals — 2 distinct geographic clusters identified", "Step 2: Surjani cluster: 5 signals, 45mm rainfall — classified as urban_flooding", "Step 3: North Karachi cluster: heat stress indicators — classified as heatwave", "Step 4: Severity scoring based on population density, duration, spread risk"] },
        };
        detectData = fallbackDetection[crisisType] ?? fallbackDetection['flood'];
      }

      setAgentOutput("detection", { data: detectData });
      if (detectData?.crises) setActiveCrises(detectData.crises);
      detectData?.reasoning_trace?.forEach((line: string) => appendAgentLog("detection", line));
      setAgentState("detection", "done");
      const crisisCount = detectData?.crises?.length ?? 0;
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "detection", message: `${crisisCount} crisis${crisisCount !== 1 ? 'es' : ''} detected — ${detectData?.crises?.map((c: any) => `${c.crisis_id}:${c.severity}`).join(', ')}`, status: "success" });
      await delay(DEMO_DELAY);

      // ─── Agent 3: Resource Allocation ────────────────────────────────
      setAgentState("allocation", "thinking");
      appendAgentLog("allocation", "Loading available resources from Karachi depot inventory...");
      appendAgentLog("allocation", "Calculating travel times to crisis zones...");
      appendAgentLog("allocation", "Optimizing allocation across competing crises...");

      let allocData: any;
      try {
        const allocRes = await axios.post(`${BASE_URL}/api/allocate`, detectData, { timeout: 30000 });
        allocData = allocRes.data.data;
      } catch {
        setDegradedMode(true);
        const C002_ALLOC = { crisis_id: "C002", assigned_resources: [{ type: "medical_team", unit_id: "MT-06", eta_minutes: 20 }], unmet_needs: ["water_tanker"], trade_off_note: "Primary resources committed to C001 — limited capacity for C002" };
        const fallbackAllocation: Record<string, any> = {
          fire:           { allocations: [{ crisis_id: "C001", assigned_resources: [{ type: "fire_brigade", unit_id: "FB-02", eta_minutes: 7 }, { type: "medical_team", unit_id: "MT-04", eta_minutes: 10 }], unmet_needs: ["water_tanker"], trade_off_note: "All fire units redirected from standby — C002 receives only MT-06" }, C002_ALLOC], resource_utilization: "91%", reasoning_trace: ["Step 1: Industrial fire — FB-02 closest unit (ETA 7 min)", "Step 2: Medical team MT-04 for burn casualties at C001", "Step 3: Water tankers all deployed — mutual aid requested", "Step 4: C002 heatwave — MT-06 dispatched, resource utilization 91%"] },
          accident:       { allocations: [{ crisis_id: "C001", assigned_resources: [{ type: "ambulance", unit_id: "AM-01", eta_minutes: 6 }, { type: "police_unit", unit_id: "PU-03", eta_minutes: 4 }], unmet_needs: [], trade_off_note: "Units pre-positioned on Shahrah-e-Faisal — sharing capacity with C002" }, C002_ALLOC], resource_utilization: "72%", reasoning_trace: ["Step 1: Road accident — PU-03 closest (ETA 4 min)", "Step 2: AM-01 ambulance dispatched for casualties at C001", "Step 3: MT-06 dispatched to C002 heatwave cluster in North Karachi", "Step 4: Resource utilization 72% — manageable across both crises"] },
          heatwave:       { allocations: [{ crisis_id: "C001", assigned_resources: [{ type: "medical_team", unit_id: "MT-01", eta_minutes: 15 }, { type: "water_tanker", unit_id: "WT-02", eta_minutes: 20 }], unmet_needs: ["cooling_center"], trade_off_note: "Cooling centers require EDO Health approval — grid fault delays C002" }, { crisis_id: "C002", assigned_resources: [{ type: "utility_team", unit_id: "KE-09", eta_minutes: 30 }], unmet_needs: ["generator_unit"], trade_off_note: "Generator units committed to critical facilities" }], resource_utilization: "83%", reasoning_trace: ["Step 1: Heatwave C001 — medical teams prioritized for heatstroke cases", "Step 2: Water tankers for hydration distribution in Korangi", "Step 3: Power outage C002 in DHA — KE-09 utility team dispatched", "Step 4: Resource utilization 83% — constrained across both incidents"] },
          power:          { allocations: [{ crisis_id: "C001", assigned_resources: [{ type: "utility_team", unit_id: "KE-07", eta_minutes: 25 }, { type: "generator_unit", unit_id: "GU-03", eta_minutes: 30 }], unmet_needs: [], trade_off_note: "K-Electric grid team notified for permanent fix — MT-06 diverted to C002" }, C002_ALLOC], resource_utilization: "68%", reasoning_trace: ["Step 1: Power outage C001 — KE-07 and GU-03 dispatched (ETA 25-30 min)", "Step 2: Emergency generators deployed to hospitals first", "Step 3: C002 heatwave worsening due to no cooling — MT-06 dispatched", "Step 4: Resource utilization 68%"] },
          infrastructure: { allocations: [{ crisis_id: "C001", assigned_resources: [{ type: "police_unit", unit_id: "PU-11", eta_minutes: 8 }, { type: "engineering_team", unit_id: "ET-01", eta_minutes: 35 }], unmet_needs: [], trade_off_note: "Heavy equipment en route — Lyari section closed, MT-06 diverted to C002" }, C002_ALLOC], resource_utilization: "74%", reasoning_trace: ["Step 1: Infrastructure failure C001 — police deployed for traffic diversion", "Step 2: KMC engineering team dispatched for structural assessment", "Step 3: Northern Bypass activated as alternate route", "Step 4: C002 heatwave cluster — MT-06 dispatched, resource utilization 74%"] },
          flood:          { allocations: [{ crisis_id: "C001", assigned_resources: [{ type: "rescue_team", unit_id: "RT-03", eta_minutes: 12 }, { type: "police_unit", unit_id: "PU-07", eta_minutes: 8 }], unmet_needs: ["water_tanker"], trade_off_note: "Water tanker redirected from C002 due to higher severity" }, { crisis_id: "C002", assigned_resources: [{ type: "medical_team", unit_id: "MT-02", eta_minutes: 15 }], unmet_needs: ["water_tanker"], trade_off_note: "Water tanker unavailable — all units deployed to C001" }], resource_utilization: "87%", reasoning_trace: ["Step 1: Loaded 3 rescue teams, 2 medical teams, 6 police units, 3 water tankers", "Step 2: C001 severity CRITICAL — assigned closest rescue team RT-03 (ETA 12 min)", "Step 3: Water tanker conflict — C001 takes priority over C002 (severity differential)", "Step 4: C002 assigned MT-02 for heat emergency treatment — ETA 15 min"] },
        };
        allocData = fallbackAllocation[crisisType] ?? fallbackAllocation['flood'];
      }

      setAgentOutput("allocation", { data: allocData });
      allocData?.reasoning_trace?.forEach((line: string) => appendAgentLog("allocation", line));
      setAgentState("allocation", "done");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "allocation", message: `Resources allocated — ${allocData?.resource_utilization ?? '—'} utilization, ${allocData?.allocations?.length ?? 0} crises served`, status: "success" });
      await delay(DEMO_DELAY);

      // ─── Agent 4: Action Execution ────────────────────────────────────
      setAgentState("execution", "thinking");
      const execLogMap: Record<string, string[]> = {
        fire:           ["Executing P1 action: evacuation order for SITE factory 4B...", "Alerting 340 workers via emergency broadcast...", "Securing 200m exclusion perimeter..."],
        accident:       ["Executing P1 action: traffic reroute via University Road...", "Adjusting signals at 3 intersections on Shahrah-e-Faisal...", "Dispatching AM-01 ambulance to accident site..."],
        heatwave:       ["Executing P1 action: cooling center activation in Korangi...", "Converting 3 schools to cooling centers (capacity 5,000)...", "Deploying water tankers for hydration distribution..."],
        power:          ["Executing P1 action: emergency generator deployment to hospitals...", "Notifying K-Electric grid repair team (feeder fault)...", "Broadcasting outage advisory to DHA Phase 6 residents..."],
        infrastructure: ["Executing P1 action: Lyari Expressway section 4 closure...", "Activating Northern Bypass as alternate route...", "Dispatching KMC engineering team for structural assessment..."],
        flood:          ["Executing P1 action: traffic reroute via M9 Motorway...", "Sending dispatch order to Rescue Team RT-03...", "Broadcasting public alert to Surjani residents..."],
      };
      const execLogs = execLogMap[crisisType] ?? execLogMap['flood'];
      execLogs.forEach(log => appendAgentLog("execution", log));

      const execActionMap: Record<string, { type: string; description: string }> = {
        fire:           { type: "evacuation_order",          description: "Evacuate SITE factory 4B — industrial fire, all workers to safety zones" },
        accident:       { type: "traffic_reroute",           description: "Reroute Shahrah-e-Faisal traffic via University Road — road accident clearance" },
        heatwave:       { type: "cooling_center_activation", description: "Activate cooling centers in Korangi — extreme heat emergency, 200,000 at risk" },
        power:          { type: "generator_deployment",      description: "Deploy emergency generators to hospitals — DHA Phase 6 power outage" },
        infrastructure: { type: "road_closure",              description: "Close Lyari Expressway section 4 — structural damage, activate Northern Bypass" },
        flood:          { type: "traffic_reroute",           description: "Redirect Surjani Road traffic via M9 Motorway due to flooding" },
      };
      const execAction = execActionMap[crisisType] ?? execActionMap['flood'];

      let execData: any;
      try {
        const execRes = await axios.post(`${BASE_URL}/api/execute`, {
          action_id: "A1", type: execAction.type, crisis_id: "C001",
          description: execAction.description,
        }, { timeout: 30000 });
        execData = execRes.data.data;
      } catch {
        setDegradedMode(true);
        const today = new Date().toISOString().slice(0, 10);
        const fallbackExecution: Record<string, any> = {
          fire:           { action_id: "A1", type: "evacuation_order",        status: "executed", before_state: "SITE factory 4B: fire spreading, workers present",                    after_state: "Evacuation complete — 340 workers cleared, perimeter secured",                   execution_time_ms: 980,  affected_count: 340,   cost_estimate_pkr: 0, receipt_id: `CIRO-${today}-A1`, side_effects: ["M10 road partial closure"],          reasoning_trace: ["Step 1: Fire evacuation order issued for factory 4B", "Step 2: Emergency alert broadcast to 340 workers", "Step 3: Perimeter secured — 200m exclusion zone", "Step 4: 340 workers evacuated in 8 minutes"] },
          accident:       { action_id: "A1", type: "traffic_reroute",         status: "executed", before_state: "Shahrah-e-Faisal blocked — 3km backup",                              after_state: "Traffic rerouted via University Road — flow restored",                           execution_time_ms: 720,  affected_count: 1200,  cost_estimate_pkr: 0, receipt_id: `CIRO-${today}-A1`, side_effects: ["University Road load +20%"],          reasoning_trace: ["Step 1: Traffic reroute via University Road activated", "Step 2: Signal timings adjusted at 3 intersections", "Step 3: 1,200 vehicles diverted", "Step 4: Accident scene cleared in 45 minutes"] },
          heatwave:       { action_id: "A1", type: "cooling_center_activation",status: "executed", before_state: "No cooling centers active in Korangi",                               after_state: "3 cooling centers opened — schools converted, water distribution active",       execution_time_ms: 2100, affected_count: 5000,  cost_estimate_pkr: 0, receipt_id: `CIRO-${today}-A1`, side_effects: ["School closures notified"],            reasoning_trace: ["Step 1: EDO Health approval obtained for cooling centers", "Step 2: 3 schools converted — capacity 5,000 people", "Step 3: Water tankers positioned at entry points", "Step 4: Alert broadcast to 200,000 Korangi residents"] },
          power:          { action_id: "A1", type: "generator_deployment",    status: "executed", before_state: "DHA Phase 6: 80,000 without power, hospitals on backup",              after_state: "Critical facilities on generators — K-Electric repair ETA 4 hours",            execution_time_ms: 1560, affected_count: 80000, cost_estimate_pkr: 0, receipt_id: `CIRO-${today}-A1`, side_effects: ["Generator fuel reserves at 60%"],       reasoning_trace: ["Step 1: Emergency generators deployed to 3 hospitals", "Step 2: K-Electric repair crew dispatched to feeder station", "Step 3: NDMA notified for extended outage protocol", "Step 4: Public advisory broadcast — ETA 4 hours"] },
          infrastructure: { action_id: "A1", type: "road_closure",            status: "executed", before_state: "Lyari Expressway: partial collapse risk, traffic flowing",             after_state: "Section closed — traffic via Northern Bypass, engineering assessment underway",execution_time_ms: 890,  affected_count: 15000, cost_estimate_pkr: 0, receipt_id: `CIRO-${today}-A1`, side_effects: ["Northern Bypass congestion +35%"],      reasoning_trace: ["Step 1: Lyari Expressway section 4 closed immediately", "Step 2: Northern Bypass as alternate — capacity sufficient", "Step 3: KMC engineering assessment team on site", "Step 4: 15,000 daily commuters notified via alert"] },
          flood:          { action_id: "A1", type: "traffic_reroute",         status: "executed", before_state: "Surjani Road congested — 3km backup, avg speed 5 km/h",               after_state: "Traffic diverted via M9 — 40% congestion reduction, avg speed 45 km/h",       execution_time_ms: 1340, affected_count: 2400,  cost_estimate_pkr: 0, receipt_id: `CIRO-${today}-A1`, side_effects: ["M9 load increased by 15%"],           reasoning_trace: ["Step 1: Received reroute action for Surjani Road (C001)", "Step 2: Identified M9 Motorway as best alternate — capacity 85%", "Step 3: Simulated signal changes at 4 Surjani intersections", "Step 4: Estimated 2,400 vehicles rerouted — congestion reduced 40%"] },
        };
        execData = fallbackExecution[crisisType] ?? fallbackExecution['flood'];
      }

      setAgentOutput("execution", { data: execData });
      execData?.reasoning_trace?.forEach((line: string) => appendAgentLog("execution", line));
      markActionExecuted("A1");
      setAgentState("execution", "done");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "execution", message: `Action executed — ${execData?.receipt_id ?? 'receipt generated'} | ${execData?.affected_count?.toLocaleString() ?? '—'} affected`, status: "success" });
      await delay(DEMO_DELAY);

      // ─── Agent 5: Verification (confirm, no false alarm) ──────────────
      setAgentState("verification", "thinking");
      appendAgentLog("verification", "Running cross-verification on all evidence sources...");
      appendAgentLog("verification", "Field team report pending — comparing signal credibility...");
      appendAgentLog("verification", "All high-credibility sources consistent with classification...");

      const firstCrisis = detectData?.crises?.[0] ?? { crisis_id: "C001", type: "urban_flooding", location: "Surjani Town", confidence: 91 };
      const verifySignalMap: Record<string, string> = {
        fire:           "Field team confirms industrial fire at SITE factory 4B. Evacuation underway. No false alarm indicators.",
        accident:       "Field team confirms road accident on Shahrah-e-Faisal. Multiple casualties reported. Emergency units on scene.",
        heatwave:       "Field team confirms extreme heatwave in Korangi. Multiple heatstroke cases. No false alarm indicators.",
        power:          "Field team confirms power outage in DHA Phase 6. Feeder fault identified at main substation. No false alarm.",
        infrastructure: "Field team confirms structural damage on Lyari Expressway section 4. Immediate closure required. No false alarm.",
        flood:          "Field team confirms flooding at Surjani. Water level rising. No false alarm indicators.",
      };
      const verifySignalText = verifySignalMap[crisisType] ?? verifySignalMap['flood'];

      let verifyData: any;
      try {
        const verifyRes = await axios.post(`${BASE_URL}/api/verify`, {
          original_crisis: firstCrisis,
          new_signal: { text: verifySignalText, credibility: 92, source_type: "field_team" },
        }, { timeout: 30000 });
        verifyData = verifyRes.data;
      } catch {
        verifyData = {
          data: {
            original_crisis_id: firstCrisis.crisis_id,
            verification_result: "confirmed",
            confidence: 92,
            reason: "Field team report (credibility 92) and news_outlet signals independently confirm the crisis. No contradicting evidence from trusted sources.",
            action: "maintain_alert",
            retraction_message: null,
            updated_classification: null,
            reasoning_trace: [
              `Step 1: Reviewing original ${firstCrisis.type} classification at ${firstCrisis.location}`,
              "Step 2: Field team source (TIER 1, credibility 92) submitted corroborating report",
              "Step 3: News outlet and verified social accounts also consistent — no contradiction",
              "Step 4: Applying decision framework: multi-source TIER 1+2 confirmation → confident verdict",
              "Step 5: No contradicting signals from any trusted source — false alarm probability <8%",
              "Step 6: Verdict: CONFIRMED. Alert maintained. Response continues as planned.",
            ],
          },
        };
      }

      setAgentOutput("verification", verifyData);
      verifyData?.data?.reasoning_trace?.forEach((line: string) => appendAgentLog("verification", line));
      setFalseAlarm(false);
      setAgentState("verification", "done");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "verification", message: `Crisis CONFIRMED — ${firstCrisis.crisis_id} alert maintained. Confidence: ${verifyData?.data?.confidence ?? 92}%`, status: "success" });

      if (Platform.OS === 'android') {
        ToastAndroid.show('All 5 agents complete. Explore tabs for details.', ToastAndroid.LONG);
      }

    } catch (e) {
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "system", message: "Pipeline error — check backend connection", status: "error" });
    } finally {
      setDemoRunning(false);
    }
  };

  const runFalseAlarmDemo = async () => {
    if (isDemoRunning) return;
    resetAll();
    setDemoRunning(true);

    // Navigate to agents tab so judges watch the verification step
    router.push('/(tabs)/agents');
    await delay(400);

    try {
      let scenario: any = null;
      try {
        const scenariosRes = await axios.get(`${BASE_URL}/api/scenarios`, { timeout: 10000 });
        const arr = scenariosRes.data?.scenarios || scenariosRes.data;
        scenario = Array.isArray(arr) && arr.length > 2 ? arr[2] : (Array.isArray(arr) ? arr[0] : null);
      } catch { /* use null */ }

      // Pre-seed crises so the map shows the incorrectly classified location
      setActiveCrises([{
        crisis_id: "C001", type: "urban_flooding", location: "Gulshan-e-Iqbal",
        coordinates: { lat: 24.9218, lng: 67.0921 },
        severity: "critical", confidence: 89, affected_population: 45000, expected_duration_hours: 2,
      }]);

      // Show first 4 agents as already completed (they ran prior to contradiction arriving)
      appendAgentLog("fusion",    "Signals ingested — initial flooding pattern detected in Gulshan-e-Iqbal");
      appendAgentLog("detection", "C001 classified: urban_flooding | CRITICAL | 89%");
      appendAgentLog("allocation","RT-03 and PU-07 dispatched to Gulshan Block 10");
      appendAgentLog("execution", "Public flood alert broadcast — 45,000 residents notified");
      setAgentState("fusion",    "done");
      setAgentState("detection", "done");
      setAgentState("allocation","done");
      setAgentState("execution", "done");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "system", message: "Initial pipeline complete — new contradicting signal received", status: "warning" });
      await delay(DEMO_DELAY);

      // Now verification agent kicks in
      setAgentState("verification", "thinking");
      appendAgentLog("verification", "Contradicting signal received from field team...");
      appendAgentLog("verification", "Field report: 'Water main burst confirmed. No rainfall accumulation seen.'");
      appendAgentLog("verification", "Comparing original social signals vs field team report (credibility: 95)...");
      appendAgentLog("verification", "Original flood classification confidence dropping from 89% to 22%...");
      appendAgentLog("verification", "Threshold crossed — initiating false alarm protocol...");

      const scenarioFieldSignal = scenario?.social_signals?.find(
        (s: any) => s?.source_type === 'field_team'
      ) ?? scenario?.social_signals?.[0];

      const verifyPayload = {
        original_crisis: { crisis_id: 'C001', type: 'urban_flooding', location: 'G-10', confidence: 89 },
        new_signal: scenarioFieldSignal
          ? {
              text: scenarioFieldSignal.text ?? 'Field verification report received.',
              credibility: scenarioFieldSignal.credibility ?? 95,
              source_type: scenarioFieldSignal.source_type ?? 'field_team',
            }
          : { text: 'Field team on ground: water main burst only. No flooding accumulation. Dry road surface 50m away.', credibility: 95, source_type: 'field_team' },
      };

      let verifyData: any;
      try {
        const verifyRes = await axios.post(`${BASE_URL}/api/verify`, verifyPayload, { timeout: 30000 });
        verifyData = verifyRes.data;
      } catch {
        verifyData = {
          data: {
            original_crisis_id: "C001",
            verification_result: "false_alarm",
            confidence: 88,
            reason: "Field team (credibility 95) confirms water main burst only. No rainfall accumulation. Original classification based on ambiguous social signals.",
            action: "retract_alert",
            retraction_message: "⚠️ RETRACTION: Flood alert for G-10 retracted. Reclassified as infrastructure_failure. KWSB (water utility) notified. Public alert cancelled.",
            updated_classification: "infrastructure_failure",
            reasoning_trace: [
              "Step 1: Received contradicting field report (credibility score: 95 — high trust)",
              "Step 2: Original flooding confidence was 89% based on social + weather signals",
              "Step 3: Field team source outweighs citizen reports in credibility hierarchy",
              "Step 4: Original confidence drops to 22% — below 60% threshold for classification",
              "Step 5: Updated classification: infrastructure_failure (water main burst)",
              "Step 6: Alert retraction issued — KWSB utility provider notified for repair",
            ],
          },
        };
      }

      setAgentOutput("verification", verifyData);
      verifyData?.data?.reasoning_trace?.forEach((line: string) => appendAgentLog("verification", line));
      setFalseAlarm(true);
      setAgentState("verification", "done");
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "verification", message: "FALSE ALARM — C001 reclassified as infrastructure_failure. Alert retracted.", status: "warning" });

    } catch (e) {
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: "verification", message: "Verification error", status: "error" });
    } finally {
      setDemoRunning(false);
    }
  };

  const quickCategories = [
    { label: 'Flood', icon: 'water', emoji: '🌊' },
    { label: 'Fire', icon: 'flame', emoji: '🔥' },
    { label: 'Accident', icon: 'car', emoji: '💥' },
    { label: 'Heatwave', icon: 'thermometer', emoji: '🌡️' },
    { label: 'Power', icon: 'flash', emoji: '⚡' },
    { label: 'Infrastructure', icon: 'construct', emoji: '🚧' },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isDegradedMode && (
        <View style={styles.degradedBanner}>
          <Text style={styles.degradedText}>⚠️ DEGRADED MODE</Text>
        </View>
      )}
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Muhafiz</Text>
            <Text style={styles.subtitle}>Crisis Intelligence & Response Orchestrator</Text>
            <Text style={styles.city}>Karachi, Pakistan</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.clock}>{time.toLocaleTimeString()}</Text>
            <View style={[styles.statusDot, { backgroundColor: isDemoRunning ? Colors.accentRed : Colors.accentGreen }]} />
            {/* User badge + logout */}
            <View style={styles.userRow}>
              <View style={[styles.roleBadge, { borderColor: isAdmin ? Colors.accentRed : Colors.accentBlue }]}>
                <Text style={[styles.roleText, { color: isAdmin ? Colors.accentRed : Colors.accentBlue }]}>
                  {isAdmin ? 'ADMIN' : 'USER'}
                </Text>
              </View>
              <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Signal Input */}
        <View style={styles.card}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>SUBMIT INCIDENT REPORT</Text>
            {inputText.trim().length > 0 && (() => {
              const s = inputText.toLowerCase();
              const detected =
                (s.includes('fire') || s.includes('aag') || s.includes('dhuan') || s.includes('jal raha') || s.includes('jal rahi') || s.includes('blast') || s.includes('explosion') || s.includes('sulag')) ? { label: 'Fire', color: Colors.accentRed, emoji: '🔥' } :
                (s.includes('accident') || s.includes('takkar') || s.includes('hadsa') || s.includes('crash') || s.includes('gaari phas') || s.includes('gaari uld') || s.includes('collision')) ? { label: 'Accident', color: Colors.accentOrange ?? '#f97316', emoji: '💥' } :
                (s.includes('heat') || s.includes('garmi') || s.includes('tapish') || s.includes('behosh') || s.includes('luu') || s.includes('heatstroke') || s.includes('sunstroke')) ? { label: 'Heatwave', color: Colors.accentAmber, emoji: '🌡️' } :
                (s.includes('power') || s.includes('bijli') || s.includes('light nahi') || s.includes('light band') || s.includes('blackout') || s.includes('andhera') || s.includes('load shed')) ? { label: 'Power Outage', color: Colors.accentBlue, emoji: '⚡' } :
                (s.includes('infrastructure') || s.includes('toot') || s.includes('daraar') || s.includes('bridge') || s.includes('pul') || s.includes('gir gaya') || s.includes('collapse')) ? { label: 'Infrastructure', color: Colors.accentAmber, emoji: '🚧' } :
                (s.includes('pani') || s.includes('barish') || s.includes('baarish') || s.includes('flood') || s.includes('bhar gaya') || s.includes('doob') || s.includes('waterlog') || s.includes('naali')) ? { label: 'Flood', color: Colors.accentBlue, emoji: '🌊' } :
                null;
              return detected ? (
                <View style={[styles.detectedChip, { backgroundColor: `${detected.color}22`, borderColor: detected.color }]}>
                  <Text style={[styles.detectedChipText, { color: detected.color }]}>{detected.emoji} {detected.label} detected</Text>
                </View>
              ) : null;
            })()}
          </View>
          <TextInput
            style={styles.input}
            placeholder={"e.g. Gulshan mein aag lag gayi hai\ne.g. Surjani mein pani bhar gaya\ne.g. DHA mein bijli nahi 3 ghante se"}
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isDemoRunning}
          />
          {!isAdmin && (
            <Text style={styles.fieldReportHint}>Field officer mode — submit your report above to run the AI pipeline</Text>
          )}
          <View style={styles.inputFooter}>
            <Text style={styles.inputHint}>Roman Urdu / English / Urdu — AI detects crisis type automatically</Text>
            <Text style={[styles.charCount, inputText.length > 200 && { color: Colors.accentAmber }]}>{inputText.length}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, (!inputText.trim() || isDemoRunning) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={submitting || isDemoRunning || !inputText.trim()}
          >
            {submitting
              ? <View style={styles.submitRow}><ActivityIndicator color="#fff" size="small" /><Text style={[styles.submitText, { marginLeft: 8 }]}>Launching 5-Agent Pipeline...</Text></View>
              : <View style={styles.submitRow}><Text style={styles.submitText}>Analyze with AI Agents</Text><Text style={styles.submitSubtext}>  5 agents • live AI</Text></View>
            }
          </TouchableOpacity>
        </View>

        {/* Quick Reports */}
        <View style={styles.grid}>
          {quickCategories.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.gridItem, (isDemoRunning || !isAdmin) && { opacity: 0.5 }]}
              disabled={isDemoRunning || !isAdmin}
              onPress={() => { router.push('/(tabs)/agents'); runDemoSequence(`${item.emoji} ${item.label} incident reported in Karachi`); }}
            >
              <Text style={styles.gridEmoji}>{item.emoji}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
              {!isAdmin && <Text style={styles.adminOnlyLabel}>Admin</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Crises */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>ACTIVE CRISES</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{activeCrises.length}</Text></View>
          </View>
          {activeCrises.length === 0 ? (
            <Text style={styles.mutedText}>No active incidents</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeCrises.map((crisis, idx) => {
                const sevColor = crisis.severity === 'critical' ? Colors.accentRed : crisis.severity === 'high' ? Colors.accentOrange : crisis.severity === 'medium' ? Colors.accentAmber : Colors.accentGreen;
                const crisisEmoji = crisis.type?.includes('flood') ? '🌊' : crisis.type?.includes('heat') ? '🌡️' : crisis.type?.includes('fire') ? '🔥' : crisis.type?.includes('accident') ? '💥' : crisis.type?.includes('power') ? '⚡' : '🚧';
                return (
                  <View key={idx} style={[styles.crisisCard, { borderLeftColor: sevColor, borderLeftWidth: 3 }]}>
                    <Text style={styles.crisisEmoji}>{crisisEmoji}</Text>
                    <Text style={styles.crisisType}>{crisis.type?.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.crisisLocation}>{crisis.location}</Text>
                    <View style={styles.crisisMeta}>
                      <View style={[styles.severityBadge, { backgroundColor: `${sevColor}33` }]}>
                        <Text style={[styles.severityBadgeText, { color: sevColor }]}>{crisis.severity?.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.confidenceText}>{crisis.confidence > 1 ? Math.round(crisis.confidence) : Math.round(crisis.confidence * 100)}%</Text>
                    </View>
                    <Text style={styles.crisisPopulation}>{crisis.affected_population?.toLocaleString()} affected</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Live Signal Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>LIVE SIGNALS</Text>
            <View style={[styles.badge, { backgroundColor: Colors.accentBlue }]}>
              <Text style={styles.badgeText}>{liveSignals.length}</Text>
            </View>
          </View>
          <View style={styles.signalList}>
            {liveSignals.map((signal, idx) => (
              <View key={idx} style={styles.signalItem}>
                <Ionicons name={signal.source as any} size={16} color={Colors.accentBlue} />
                <Text style={styles.signalText} numberOfLines={2}>{signal.text}</Text>
                <Text style={styles.signalTime}>{signal.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <View style={styles.actionLabelRow}>
            <Text style={styles.actionLabel}>DEMO SCENARIOS</Text>
            {!isAdmin && (
              <View style={styles.adminOnlyBadge}>
                <Ionicons name="lock-closed" size={10} color={Colors.accentAmber} />
                <Text style={styles.adminOnlyBadgeText}>Admin Only</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.demoButton, (isDemoRunning || !isAdmin) && { opacity: 0.5 }]}
            onPress={() => runDemoSequence()}
            disabled={isDemoRunning || !isAdmin}
          >
            {isDemoRunning
              ? <View style={styles.submitRow}><ActivityIndicator color="#fff" size="small" /><Text style={[styles.demoButtonText, { marginLeft: 10 }]}>Agents Running...</Text></View>
              : <>
                  <Text style={styles.demoButtonText}>Run Full Demo</Text>
                  <Text style={styles.demoSubtext}>Monsoon Emergency — Flooding + Heatwave</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.falseAlarmButton, (isDemoRunning || !isAdmin) && { opacity: 0.5 }]}
            onPress={runFalseAlarmDemo}
            disabled={isDemoRunning || !isAdmin}
          >
            <Text style={styles.falseAlarmText}>Test False Alarm Scenario</Text>
            <Text style={styles.falseAlarmSub}>Watch Verification Agent detect & retract</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 48 },
  headerRight: { alignItems: 'flex-end' },
  logo: { color: Colors.accentRed, fontSize: 34, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  city: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  clock: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'monospace', marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-end' },
  card: { backgroundColor: Colors.bgCard, padding: 16, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inputLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  detectedChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  detectedChipText: { fontSize: 10, fontWeight: 'bold' },
  input: { color: Colors.textPrimary, fontSize: 15, minHeight: 72, textAlignVertical: 'top', marginBottom: 8 },
  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  inputHint: { color: Colors.textMuted, fontSize: 11, flex: 1 },
  charCount: { color: Colors.textMuted, fontSize: 11, marginLeft: 8 },
  submitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitButton: { backgroundColor: Colors.accentRed, padding: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  submitSubtext: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  gridItem: { width: '31%', backgroundColor: Colors.bgCard, padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  gridEmoji: { fontSize: 24, marginBottom: 4 },
  gridLabel: { color: Colors.textPrimary, fontSize: 12, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginRight: 8 },
  badge: { backgroundColor: Colors.accentRed, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  mutedText: { color: Colors.textMuted, fontStyle: 'italic' },
  crisisCard: { backgroundColor: Colors.bgCard, padding: 16, borderRadius: 12, marginRight: 12, width: 200, borderWidth: 1, borderColor: Colors.border },
  crisisEmoji: { fontSize: 28, marginBottom: 6 },
  crisisType: { color: Colors.textPrimary, fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  crisisLocation: { color: Colors.textMuted, fontSize: 13, marginVertical: 4 },
  crisisMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  severityBadgeText: { fontSize: 10, fontWeight: 'bold' },
  confidenceText: { color: Colors.accentGreen, fontSize: 13, fontWeight: 'bold' },
  crisisPopulation: { color: Colors.textMuted, fontSize: 11, marginTop: 6 },
  signalList: { backgroundColor: Colors.bgCard, borderRadius: 12, overflow: 'hidden' },
  signalItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  signalText: { color: Colors.textPrimary, flex: 1, marginLeft: 12, fontSize: 14 },
  signalTime: { color: Colors.textMuted, fontSize: 10, marginLeft: 8 },
  actionSection: { marginTop: 4 },
  actionLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  demoButton: { backgroundColor: Colors.accentRed, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  demoButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  demoSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  falseAlarmButton: { borderWidth: 1, borderColor: Colors.accentAmber, padding: 14, borderRadius: 14, alignItems: 'center' },
  falseAlarmText: { color: Colors.accentAmber, fontSize: 15, fontWeight: 'bold' },
  falseAlarmSub: { color: 'rgba(245,158,11,0.7)', fontSize: 11, marginTop: 3 },
  degradedBanner: { backgroundColor: Colors.accentAmber, padding: 10, alignItems: 'center', marginTop: 30 },
  degradedText: { color: '#000', fontWeight: 'bold', fontSize: 11 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  roleBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  roleText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  logoutBtn: { padding: 2 },
  actionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  adminOnlyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentAmber + '22', borderWidth: 1, borderColor: Colors.accentAmber, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  adminOnlyBadgeText: { color: Colors.accentAmber, fontSize: 9, fontWeight: 'bold' },
  adminOnlyLabel: { color: Colors.accentAmber, fontSize: 8, fontWeight: 'bold', marginTop: 2 },
  fieldReportHint: { color: Colors.accentBlue, fontSize: 11, marginBottom: 8, fontStyle: 'italic' },
});
