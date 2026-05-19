import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useCrisisStore } from '../../store/crisisStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../constants/config';

// ─── Types ─────────────────────────────────────────────────────────
type Priority = 'high' | 'medium' | 'low';
type StakeholderType = 'public' | 'hospital' | 'emergency' | 'utility' | 'transport' | 'media';

interface Stakeholder {
  id: string;
  type: StakeholderType;
  name: string;
  message: string;
  priority: Priority;
  sent: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<StakeholderType, { icon: string; color: string; label: string }> = {
  public:    { icon: 'people',         color: Colors.accentRed,   label: 'PUBLIC'    },
  hospital:  { icon: 'medical',        color: '#e879f9',          label: 'HOSPITAL'  },
  emergency: { icon: 'flash',          color: Colors.accentAmber, label: 'EMERGENCY' },
  utility:   { icon: 'flash-outline',  color: '#38bdf8',          label: 'UTILITY'   },
  transport: { icon: 'bus',            color: '#34d399',          label: 'TRANSPORT' },
  media:     { icon: 'newspaper',      color: Colors.textMuted,   label: 'MEDIA'     },
};

const PRIORITY_COLOR: Record<Priority, string> = {
  high:   Colors.accentRed,
  medium: Colors.accentAmber,
  low:    Colors.textMuted,
};

function buildFallbackAlerts(
  crises: ReturnType<typeof useCrisisStore.getState>['activeCrises'],
  verificationOutput: any,
  falseAlarm: boolean,
): Stakeholder[] {
  const primary = crises[0];
  const secondary = crises[1];
  const loc     = primary?.location ?? 'Karachi';
  const loc2    = secondary?.location ?? 'North Karachi';
  const pop     = primary ? Math.round((primary.affected_population ?? 40000) / 1000) : 40;
  const type    = primary?.type?.replace(/_/g, ' ') ?? 'flooding';
  const sev     = primary?.severity ?? 'high';

  return [
    {
      id: 'S1', type: 'public', priority: 'high', sent: false,
      name: 'Public Alert',
      message: `⚠️ ${loc} میں ${type === 'urban flooding' ? 'سیلاب' : 'ہنگامی صورتحال'} کی اطلاع — فوری طور پر محفوظ مقامات پر جائیں۔\nCIRO ALERT: ${sev.toUpperCase()} ${type} confirmed at ${loc}. Approx ${pop}K residents affected. Evacuate to designated shelters. Avoid low-lying roads.`,
    },
    {
      id: 'S2', type: 'hospital', priority: 'high', sent: false,
      name: 'Jinnah Hospital',
      message: `CIRO ALERT: Mass casualty event possible — ${type} at ${loc}. Prepare ${Math.min(100, pop * 2)} additional beds. Trauma team on standby. First patient ETA: 30–45 min. Coordinate with Abbasi Shaheed for overflow.`,
    },
    {
      id: 'S3', type: 'emergency', priority: 'high', sent: false,
      name: 'Emergency Services',
      message: `DISPATCH: Proceed to ${loc} (${primary?.coordinates ? `${primary.coordinates.lat.toFixed(4)}, ${primary.coordinates.lng.toFixed(4)}` : '24.9801, 67.0359'}). ${sev.toUpperCase()} ${type}. ${pop}K persons affected. All available units respond. RT-01, AM-02 already en route.`,
    },
    {
      id: 'S4', type: 'utility', priority: 'medium', sent: false,
      name: 'KE / KWSB',
      message: `CIRO SYSTEM: ${type.includes('flood') ? 'Shutdown power feeders F-234, F-235 in ' + loc + ' flood zones to prevent electrocution. Restore only after water level drops below road level.' : 'Water supply disruption expected at ' + loc + '. Pre-position tankers. Open emergency supply from nearest KWSB depot.'}`,
    },
    {
      id: 'S5', type: 'transport', priority: 'medium', sent: false,
      name: 'Transport Authority',
      message: `ROUTE UPDATE: ${primary?.location ?? 'Surjani Road'} closed due to ${type}. All R-8 and U-12 buses rerouted via Northern Bypass. M9 Highway on standby as alternate. Update all digital passenger information boards immediately.`,
    },
    {
      id: 'S6', type: 'media', priority: 'low', sent: false,
      name: 'Media / Command Center',
      message: `SITUATION REPORT — CIRO SYSTEM\nIncidents: ${crises.map(c => c.type.replace(/_/g, ' ')).join(' + ')}\nLocations: ${loc}${secondary ? ' + ' + loc2 : ''}\nSeverity: ${sev.toUpperCase()}${secondary ? ' + ' + secondary.severity.toUpperCase() : ''}\nAffected: ~${crises.reduce((s, c) => s + (c.affected_population ?? 0), 0).toLocaleString()} persons\nVerification: ${falseAlarm ? 'PARTIAL FALSE ALARM — see retraction' : 'CONFIRMED'}\nResponse: ACTIVE`,
    },
  ];
}

// ─── StakeholderCard ───────────────────────────────────────────────
function StakeholderCard({
  item,
  onSend,
}: {
  item: Stakeholder;
  onSend: () => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  return (
    <View style={[sc.card, item.sent && sc.cardSent]}>
      <View style={sc.header}>
        <View style={[sc.typeBadge, { borderColor: cfg.color }]}>
          <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
          <Text style={[sc.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={[sc.priorityBadge, { backgroundColor: PRIORITY_COLOR[item.priority] + '22', borderColor: PRIORITY_COLOR[item.priority] }]}>
          <Text style={[sc.priorityText, { color: PRIORITY_COLOR[item.priority] }]}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={sc.name}>{item.name}</Text>
      <Text style={sc.message}>{item.message}</Text>

      {item.sent ? (
        <View style={sc.sentRow}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
          <Text style={sc.sentText}>Alert Sent</Text>
        </View>
      ) : (
        <TouchableOpacity style={[sc.sendBtn, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]} onPress={onSend}>
          <Ionicons name="send" size={12} color={cfg.color} />
          <Text style={[sc.sendBtnText, { color: cfg.color }]}>Send Alert</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────
export default function StakeholdersScreen() {
  const activeCrises       = useCrisisStore(s => s.activeCrises);
  const verificationOutput = useCrisisStore(s => s.verificationOutput);
  const executionOutput    = useCrisisStore(s => s.executionOutput);
  const falseAlarm         = useCrisisStore(s => s.falseAlarmDetected);
  const agentStates        = useCrisisStore(s => s.agentStates);
  const agentsDone         = Object.values(agentStates).filter(v => v === 'done').length;

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading]           = useState(false);
  const [generated, setGenerated]       = useState(false);
  const [retractionSent, setRetractionSent] = useState(false);
  const [aiMode, setAiMode]             = useState(false);

  const hasCrises = activeCrises.length > 0;

  const generateAlerts = useCallback(async (useAI: boolean) => {
    setLoading(true);
    setAiMode(useAI);

    if (useAI) {
      try {
        const payload = {
          crises: activeCrises,
          executed_actions: executionOutput ? [executionOutput] : [],
          verification_result: verificationOutput?.data?.verification_result ?? 'confirmed',
          retraction_message: verificationOutput?.data?.retraction_message ?? null,
        };
        const res = await axios.post(`${BASE_URL}/api/stakeholders`, payload, { timeout: 20000 });
        const aiStakeholders: Stakeholder[] = (res.data?.data?.stakeholders ?? []).map((s: any) => ({
          ...s,
          sent: false,
        }));
        if (aiStakeholders.length > 0) {
          setStakeholders(aiStakeholders);
          setGenerated(true);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to template fallback
      }
    }

    // Template fallback (immediate, no network needed)
    const fallback = hasCrises
      ? buildFallbackAlerts(activeCrises, verificationOutput, falseAlarm)
      : buildFallbackAlerts(
          [{ crisis_id: 'C001', type: 'urban_flooding', location: 'Surjani Town', coordinates: { lat: 24.9801, lng: 67.0359 }, severity: 'critical', confidence: 91, affected_population: 45000, expected_duration_hours: 4 }],
          null, false
        );
    setStakeholders(fallback);
    setGenerated(true);
    setLoading(false);
  }, [activeCrises, verificationOutput, executionOutput, falseAlarm, hasCrises]);

  const handleSend = (id: string) =>
    setStakeholders(prev => prev.map(s => s.id === id ? { ...s, sent: true } : s));

  const handleSendAll = () => {
    setStakeholders(prev => prev.map(s => ({ ...s, sent: true })));
    if (falseAlarm) setRetractionSent(true);
  };

  const retractMsg = verificationOutput?.data?.retraction_message
    ?? 'Previous alert for this location is hereby retracted. Incident reclassified. All units stand down. KWSB/utility provider notified. Public alert cancelled.';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>STAKEHOLDER ALERTS</Text>
        <Text style={styles.subtitle}>
          {hasCrises
            ? `${activeCrises.length} active crisis${activeCrises.length > 1 ? 'es' : ''} — ${activeCrises.reduce((s, c) => s + (c.affected_population ?? 0), 0).toLocaleString()} persons affected`
            : 'Run a crisis analysis to generate alerts'}
        </Text>

        {/* Agent progress indicator */}
        <View style={styles.progressRow}>
          {(['fusion','detection','allocation','execution','verification'] as const).map(a => (
            <View
              key={a}
              style={[styles.progressDot, { backgroundColor: agentStates[a] === 'done' ? Colors.accentGreen : Colors.border }]}
            />
          ))}
          <Text style={styles.progressLabel}>{agentsDone}/5 agents done</Text>
        </View>
      </View>

      <ScrollView style={styles.content} bounces={false} contentContainerStyle={styles.scrollContent}>

        {/* Generate buttons */}
        {!generated ? (
          <View style={styles.generateSection}>
            <Text style={styles.generateTitle}>Ready to broadcast crisis alerts?</Text>
            <Text style={styles.generateDesc}>
              CIRO will generate stakeholder notifications tailored to the detected crises across 6 channels: public, hospital, emergency services, utilities, transport, and media.
            </Text>
            <TouchableOpacity
              style={[styles.aiBtn, loading && { opacity: 0.6 }]}
              onPress={() => generateAlerts(true)}
              disabled={loading}
            >
              {loading && aiMode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="sparkles" size={16} color="#fff" />
              )}
              <Text style={styles.aiBtnText}>
                {loading && aiMode ? 'Generating...' : 'Generate AI Alerts'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.templateBtn, loading && { opacity: 0.6 }]}
              onPress={() => generateAlerts(false)}
              disabled={loading}
            >
              <Ionicons name="document-text" size={14} color={Colors.textMuted} />
              <Text style={styles.templateBtnText}>Use Template Alerts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Status row */}
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { borderColor: aiMode ? Colors.accentGreen : Colors.textMuted }]}>
                <Ionicons name={aiMode ? 'sparkles' : 'document-text'} size={10} color={aiMode ? Colors.accentGreen : Colors.textMuted} />
                <Text style={[styles.statusText, { color: aiMode ? Colors.accentGreen : Colors.textMuted }]}>
                  {aiMode ? 'AI-Generated' : 'Template'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleSendAll} style={styles.sendAllBtn}>
                <Ionicons name="send" size={12} color={Colors.accentRed} />
                <Text style={styles.sendAllText}>Send All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setGenerated(false); setStakeholders([]); setRetractionSent(false); }} style={styles.resetBtn}>
                <Ionicons name="refresh" size={12} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* False alarm retraction card */}
            {falseAlarm && (
              <View style={styles.retractionCard}>
                <View style={styles.retractionIcon}>
                  <Ionicons name="warning" size={18} color={Colors.accentAmber} />
                </View>
                <View style={styles.retractionContent}>
                  <Text style={styles.retractionTitle}>⚠️ RETRACTION REQUIRED</Text>
                  <Text style={styles.retractionMessage}>{retractMsg}</Text>
                  {!retractionSent ? (
                    <TouchableOpacity style={styles.retractionBtn} onPress={() => setRetractionSent(true)}>
                      <Text style={styles.retractionBtnText}>Send Retraction</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.retractionSentRow}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.accentAmber} />
                      <Text style={styles.retractionSentText}>Retraction Sent</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {stakeholders.map(item => (
              <StakeholderCard key={item.id} item={item} onSend={() => handleSend(item.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.bgPrimary },
  header:           { padding: 16, paddingTop: 60, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:            { color: Colors.textPrimary, fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  subtitle:         { color: Colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 10 },
  progressRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressDot:      { width: 8, height: 8, borderRadius: 4 },
  progressLabel:    { color: Colors.textMuted, fontSize: 11, marginLeft: 6 },
  content:          { flex: 1 },
  scrollContent:    { padding: 16, paddingBottom: 60 },
  generateSection:  { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  generateTitle:    { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  generateDesc:     { color: Colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  aiBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accentRed, paddingVertical: 13, borderRadius: 10, marginBottom: 10 },
  aiBtnText:        { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  templateBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  templateBtnText:  { color: Colors.textMuted, fontSize: 13 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, backgroundColor: 'transparent' },
  statusText:       { fontSize: 10, fontWeight: 'bold' },
  sendAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', backgroundColor: Colors.accentRed + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: Colors.accentRed },
  sendAllText:      { color: Colors.accentRed, fontSize: 11, fontWeight: 'bold' },
  resetBtn:         { padding: 5 },
  retractionCard:   { backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: Colors.accentAmber, borderRadius: 12, padding: 14, flexDirection: 'row', marginBottom: 14 },
  retractionIcon:   { marginRight: 10, marginTop: 2 },
  retractionContent: { flex: 1 },
  retractionTitle:  { color: Colors.accentAmber, fontWeight: 'bold', fontSize: 12, marginBottom: 6 },
  retractionMessage: { color: Colors.textPrimary, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  retractionBtn:    { backgroundColor: Colors.accentAmber, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6, alignSelf: 'flex-start' },
  retractionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 11 },
  retractionSentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  retractionSentText: { color: Colors.accentAmber, fontWeight: 'bold', fontSize: 11 },
});

const sc = StyleSheet.create({
  card:       { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardSent:   { opacity: 0.65 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  typeLabel:  { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginLeft: 'auto' },
  priorityText: { fontSize: 9, fontWeight: 'bold' },
  name:       { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  message:    { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  sentRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sentText:   { color: Colors.accentGreen, fontSize: 11, fontWeight: 'bold' },
  sendBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  sendBtnText: { fontSize: 11, fontWeight: 'bold' },
});
