import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, ToastAndroid, Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useCrisisStore, Crisis } from '../../store/crisisStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../constants/config';

// ─── Helpers ───────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = {
  critical: Colors.accentRed,
  high:     Colors.accentAmber,
  medium:   '#38bdf8',
  low:      Colors.accentGreen,
};

const TYPE_ICON: Record<string, string> = {
  traffic_reroute:   'car',
  emergency_dispatch:'flash',
  public_alert:      'megaphone',
  medical_dispatch:  'medical',
  shelter_activation:'home',
  power_shutdown:    'flash-off',
  water_dispatch:    'water',
  rescue_team:       'people',
  police_unit:       'shield',
  ambulance:         'car-sport',
  medical_team:      'medical',
  water_tanker:      'water',
};

function crisisEmoji(type: string) {
  if (type.includes('flood')) return '🌊';
  if (type.includes('heat'))  return '🌡️';
  if (type.includes('fire'))  return '🔥';
  if (type.includes('accident')) return '💥';
  if (type.includes('power')) return '⚡';
  if (type.includes('water')) return '💧';
  return '🚨';
}

// Derive action list from allocation output
function actionsFromAllocation(crisis: Crisis, allocationOutput: any): any[] {
  if (!allocationOutput) return fallbackActions(crisis);
  const allocData = allocationOutput?.data ?? allocationOutput;
  const allocations: any[] = allocData?.allocations ?? [];
  const match = allocations.find((a: any) => a.crisis_id === crisis.crisis_id);
  if (!match) return fallbackActions(crisis);

  const acts: any[] = (match.assigned_resources ?? []).map((r: any, i: number) => ({
    id: `${crisis.crisis_id}-${i + 1}`,
    type: r.type,
    unit_id: r.unit_id,
    crisis_id: crisis.crisis_id,
    description: r.rationale ?? `Deploy ${r.unit_id} to ${crisis.location}`,
    eta_minutes: r.eta_minutes,
    priority: i + 1,
    estimated_impact: `ETA ${r.eta_minutes} min`,
  }));
  if (acts.length === 0) return fallbackActions(crisis);
  return acts;
}

function fallbackActions(crisis: Crisis) {
  const typeActions: Record<string, any[]> = {
    urban_flooding: [
      { id: `${crisis.crisis_id}-F1`, type: 'traffic_reroute',   description: `Redirect ${crisis.location} traffic via alternate route`, priority: 1, estimated_impact: '40% congestion reduction' },
      { id: `${crisis.crisis_id}-F2`, type: 'emergency_dispatch', description: `Deploy rescue team to ${crisis.location}`,                 priority: 2, estimated_impact: 'Est. 50 stranded assisted' },
      { id: `${crisis.crisis_id}-F3`, type: 'public_alert',      description: `Broadcast bilingual flood warning to ${crisis.location}`,   priority: 3, estimated_impact: `${Math.round((crisis.affected_population ?? 40000) / 1000)}K residents notified` },
    ],
    heatwave: [
      { id: `${crisis.crisis_id}-H1`, type: 'medical_dispatch',   description: `Deploy medical team to ${crisis.location}`,                priority: 1, estimated_impact: 'Est. 200 heat cases treated' },
      { id: `${crisis.crisis_id}-H2`, type: 'shelter_activation', description: `Open emergency cooling shelter at ${crisis.location}`,     priority: 2, estimated_impact: '800+ capacity available' },
      { id: `${crisis.crisis_id}-H3`, type: 'water_dispatch',     description: `Deploy water tanker to ${crisis.location}`,                priority: 3, estimated_impact: '5,000 L drinking water' },
    ],
    industrial_fire: [
      { id: `${crisis.crisis_id}-I1`, type: 'emergency_dispatch', description: `Dispatch fire rescue to ${crisis.location}`,               priority: 1, estimated_impact: 'Fire containment' },
      { id: `${crisis.crisis_id}-I2`, type: 'police_unit',        description: `Cordon off 500m radius at ${crisis.location}`,             priority: 2, estimated_impact: 'Public safety zone' },
    ],
  };
  const key = Object.keys(typeActions).find(k => crisis.type?.includes(k.split('_')[0])) ?? 'urban_flooding';
  return (typeActions[key] ?? typeActions['urban_flooding']).map(a => ({ ...a, crisis_id: crisis.crisis_id }));
}

// ─── ActionCard ────────────────────────────────────────────────────
function ActionCard({ action, executed, onExecute, execResult, isAdmin }: {
  action: any;
  executed: boolean;
  onExecute: () => void;
  execResult?: any;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const icon = TYPE_ICON[action.type] ?? 'flash';

  const handleTap = async () => {
    if (executed || loading || !isAdmin) return;
    setLoading(true);
    await onExecute();
    setLoading(false);
  };

  return (
    <View style={[ac.card, executed && ac.cardDone]}>
      <View style={ac.row}>
        <View style={[ac.iconBox, executed && { backgroundColor: Colors.accentGreen + '22' }]}>
          <Ionicons name={icon as any} size={18} color={executed ? Colors.accentGreen : Colors.accentRed} />
        </View>
        <View style={ac.info}>
          <Text style={ac.type}>{action.type.replace(/_/g, ' ').toUpperCase()}</Text>
          <Text style={ac.desc}>{action.description}</Text>
          {action.unit_id && <Text style={ac.unit}>Unit: {action.unit_id}{action.eta_minutes ? `  ·  ETA ${action.eta_minutes} min` : ''}</Text>}
          <Text style={ac.impact}>↗ {action.estimated_impact}</Text>
        </View>
        <View style={ac.priorityBox}>
          <Text style={ac.priorityText}>P{action.priority}</Text>
        </View>
      </View>

      {/* Execution result */}
      {executed && execResult && (
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={ac.resultToggle}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.accentGreen} />
          <Text style={ac.resultToggleText}>Execution Receipt</Text>
        </TouchableOpacity>
      )}
      {expanded && execResult && (
        <View style={ac.resultBox}>
          <Text style={ac.receiptId}>{execResult.receipt_id}</Text>
          <Text style={ac.resultLabel}>Before</Text>
          <Text style={ac.resultText}>{execResult.before_state}</Text>
          <Text style={ac.resultLabel}>After</Text>
          <Text style={ac.resultText}>{execResult.after_state}</Text>
          {execResult.cost_estimate_pkr > 0 && (
            <Text style={ac.cost}>Cost: PKR {execResult.cost_estimate_pkr?.toLocaleString()}</Text>
          )}
        </View>
      )}

      {!executed ? (
        isAdmin ? (
          <TouchableOpacity style={ac.execBtn} onPress={handleTap} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color={Colors.accentRed} />
              : <><Ionicons name="play-circle" size={14} color={Colors.accentRed} /><Text style={ac.execBtnText}>Simulate Execution</Text></>
            }
          </TouchableOpacity>
        ) : (
          <View style={ac.viewOnlyRow}>
            <Ionicons name="eye-outline" size={13} color={Colors.textMuted} />
            <Text style={ac.viewOnlyText}>View only</Text>
          </View>
        )
      ) : (
        <View style={ac.doneRow}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
          <Text style={ac.doneText}>Executed  ·  {execResult?.execution_time_ms ?? '—'} ms  ·  {execResult?.affected_count?.toLocaleString() ?? '—'} affected</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────
export default function ActionsScreen() {
  const currentUser     = useCrisisStore(s => s.currentUser);
  const isAdmin         = currentUser?.role === 'admin';
  const activeCrises    = useCrisisStore(s => s.activeCrises);
  const allocationOutput = useCrisisStore(s => s.allocationOutput);
  const executionOutput  = useCrisisStore(s => s.executionOutput);
  const executedActions  = useCrisisStore(s => s.executedActions);
  const markActionExecuted = useCrisisStore(s => s.markActionExecuted);
  const setAgentOutput  = useCrisisStore(s => s.setAgentOutput);
  const appendLog       = useCrisisStore(s => s.appendLog);

  // Show first detected crisis by default
  const [activeIdx, setActiveIdx] = useState(0);

  // Build actions per crisis
  const allActions = activeCrises.map(c => ({
    crisis: c,
    actions: actionsFromAllocation(c, allocationOutput),
  }));

  // Fallback when no demo run yet
  const noCrises = activeCrises.length === 0;
  const displayData = noCrises
    ? [{
        crisis: { crisis_id: 'C001', type: 'urban_flooding', location: 'Surjani Town', severity: 'critical', confidence: 91, affected_population: 45000 } as Crisis,
        actions: fallbackActions({ crisis_id: 'C001', type: 'urban_flooding', location: 'Surjani Town', severity: 'critical', confidence: 91, affected_population: 45000 } as Crisis),
      }]
    : allActions;

  const current = displayData[Math.min(activeIdx, displayData.length - 1)];
  const totalActions = displayData.reduce((sum, d) => sum + d.actions.length, 0);
  const allocData = allocationOutput?.data ?? allocationOutput;

  const handleExecute = async (action: any) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/execute`, {
        action_id: action.id,
        type:       action.type,
        crisis_id:  action.crisis_id,
        description: action.description,
      }, { timeout: 30000 });
      const execData = res.data?.data ?? res.data;
      setAgentOutput('execution', { data: execData });
      appendLog({ id: Date.now().toString(), timestamp: new Date().toISOString(), agent: 'execution', message: `Action ${action.id} executed — ${execData?.receipt_id}`, status: 'success' });
    } catch {
      const fallback = {
        receipt_id: `CIRO-${new Date().toISOString().slice(0, 10)}-${action.id}`,
        before_state: `${action.type.replace(/_/g, ' ')} pending at ${current.crisis.location}`,
        after_state: `${action.type.replace(/_/g, ' ')} completed — situation improving at ${current.crisis.location}`,
        execution_time_ms: 1200 + Math.floor(Math.random() * 800),
        affected_count: current.crisis.affected_population ?? 2000,
        cost_estimate_pkr: 0,
      };
      setAgentOutput('execution', { data: fallback });
    }
    markActionExecuted(action.id);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Action ${action.id} executed`, ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RESPONSE ACTIONS</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{executedActions.length} / {totalActions} Executed</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: totalActions > 0 ? `${(executedActions.length / totalActions) * 100}%` : '0%' }]} />
          </View>
        </View>
        {allocData?.resource_utilization && (
          <Text style={styles.utilizationText}>Resource utilization: <Text style={{ color: Colors.accentGreen }}>{allocData.resource_utilization}</Text></Text>
        )}
      </View>

      {/* Crisis tabs */}
      <View style={styles.tabsRow}>
        {displayData.map((d, i) => {
          const col = SEVERITY_COLOR[d.crisis.severity] ?? Colors.textMuted;
          return (
            <TouchableOpacity
              key={d.crisis.crisis_id}
              style={[styles.tab, i === activeIdx && { borderBottomColor: col, borderBottomWidth: 2 }]}
              onPress={() => setActiveIdx(i)}
            >
              <Text style={styles.tabEmoji}>{crisisEmoji(d.crisis.type)}</Text>
              <Text style={[styles.tabText, i === activeIdx && { color: col }]}>
                {d.crisis.crisis_id}
              </Text>
              <Text style={[styles.tabSev, { color: col }]}>{d.crisis.severity?.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.content} bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* Crisis summary */}
        {current && (
          <View style={[styles.crisisSummary, { borderLeftColor: SEVERITY_COLOR[current.crisis.severity] ?? Colors.border }]}>
            <Text style={styles.crisisName}>{current.crisis.type?.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={styles.crisisLoc}>📍 {current.crisis.location}</Text>
            <View style={styles.crisisMetaRow}>
              <Text style={styles.crisisMetaItem}>{(current.crisis.affected_population ?? 0).toLocaleString()} affected</Text>
              <Text style={styles.crisisMetaItem}>{current.crisis.confidence > 1 ? Math.round(current.crisis.confidence) : Math.round(current.crisis.confidence * 100)}% confidence</Text>
              {current.crisis.expected_duration_hours && (
                <Text style={styles.crisisMetaItem}>{current.crisis.expected_duration_hours}h est.</Text>
              )}
            </View>
          </View>
        )}

        {/* Actions list */}
        {current?.actions.map((action: any) => (
          <ActionCard
            key={action.id}
            action={action}
            executed={executedActions.includes(action.id)}
            onExecute={() => handleExecute(action)}
            execResult={executedActions.includes(action.id) ? executionOutput?.data : undefined}
            isAdmin={isAdmin}
          />
        ))}
      </ScrollView>

      {/* Bottom summary */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Total actions</Text>
          <Text style={styles.footerValue}>{totalActions}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Executed</Text>
          <Text style={styles.footerValue}>{executedActions.length}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Lives impacted</Text>
          <Text style={[styles.footerValue, { color: Colors.accentGreen }]}>
            {(executedActions.length * 1500).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bgPrimary },
  header:          { padding: 16, paddingTop: 60, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:           { color: Colors.textPrimary, fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 10 },
  progressRow:     { marginBottom: 4 },
  progressText:    { color: Colors.textMuted, fontSize: 12, marginBottom: 6 },
  progressBarBg:   { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accentRed },
  utilizationText: { color: Colors.textMuted, fontSize: 12, marginTop: 6 },
  tabsRow:         { flexDirection: 'row', backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:             { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabEmoji:        { fontSize: 14, marginBottom: 2 },
  tabText:         { color: Colors.textMuted, fontWeight: 'bold', fontSize: 11 },
  tabSev:          { fontSize: 9, marginTop: 2 },
  content:         { flex: 1 },
  scrollContent:   { padding: 16, paddingBottom: 40 },
  crisisSummary:   { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4 },
  crisisName:      { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  crisisLoc:       { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  crisisMetaRow:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  crisisMetaItem:  { color: Colors.textMuted, fontSize: 11 },
  footer:          { backgroundColor: Colors.bgCard, padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 32 },
  footerRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  footerLabel:     { color: Colors.textMuted, fontSize: 13 },
  footerValue:     { color: Colors.textPrimary, fontSize: 13, fontWeight: 'bold' },
});

const ac = StyleSheet.create({
  card:        { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardDone:    { borderColor: Colors.accentGreen + '44' },
  row:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  iconBox:     { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.accentRed + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info:        { flex: 1 },
  type:        { color: Colors.textMuted, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.8, marginBottom: 3 },
  desc:        { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  unit:        { color: Colors.textMuted, fontSize: 11, marginBottom: 3 },
  impact:      { color: Colors.accentGreen, fontSize: 11 },
  priorityBox: { backgroundColor: Colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 8 },
  priorityText: { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold' },
  execBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.accentRed, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, alignSelf: 'flex-start' },
  execBtnText: { color: Colors.accentRed, fontSize: 12, fontWeight: 'bold' },
  doneRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText:    { color: Colors.accentGreen, fontSize: 11, fontWeight: '600' },
  resultToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  resultToggleText: { color: Colors.accentGreen, fontSize: 11 },
  resultBox:   { backgroundColor: Colors.bgPrimary, borderRadius: 8, padding: 10, marginBottom: 4 },
  receiptId:   { color: Colors.accentGreen, fontSize: 10, fontWeight: 'bold', marginBottom: 6, fontFamily: 'monospace' },
  resultLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 2 },
  resultText:  { color: Colors.textPrimary, fontSize: 11, lineHeight: 16, marginBottom: 6 },
  cost:        { color: Colors.accentAmber, fontSize: 11, fontWeight: 'bold' },
  viewOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewOnlyText: { color: Colors.textMuted, fontSize: 11 },
});
