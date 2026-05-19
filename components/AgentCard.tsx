import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useCrisisStore } from '../store/crisisStore';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface AgentCardProps {
  name: string;
  icon: string;
  agentKey: string;
  description: string;
}

function AgentSummary({ agentKey, output }: { agentKey: string; output: any }) {
  const data = output?.data;
  if (!data) return null;

  switch (agentKey) {
    case 'fusion': {
      const signals = data.fused_signals?.length ?? 0;
      const credibility = data.overall_credibility ?? '—';
      const contradictions = data.contradictions_detected?.length ?? 0;
      return (
        <View style={s.summary}>
          <View style={s.summaryRow}>
            <View style={s.stat}>
              <Text style={s.statValue}>{signals}</Text>
              <Text style={s.statLabel}>signals fused</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statValue}>{credibility}%</Text>
              <Text style={s.statLabel}>credibility</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statValue, contradictions > 0 && { color: Colors.accentAmber }]}>
                {contradictions}
              </Text>
              <Text style={s.statLabel}>contradictions</Text>
            </View>
          </View>
          {contradictions > 0 && data.contradictions_detected?.map((c: any, i: number) => (
            <View key={i} style={s.flagRow}>
              <Ionicons name="warning" size={12} color={Colors.accentAmber} />
              <Text style={s.flagText}>{c.resolution || 'Signal contradiction flagged'}</Text>
            </View>
          ))}
        </View>
      );
    }
    case 'detection': {
      const crises = data.crises ?? [];
      return (
        <View style={s.summary}>
          <Text style={[s.summaryHeading, { color: Colors.accentRed }]}>
            {crises.length} crisis{crises.length !== 1 ? 'es' : ''} detected
          </Text>
          {crises.map((c: any) => {
            const sevColor =
              c.severity === 'critical' ? Colors.accentRed :
              c.severity === 'high' ? Colors.accentOrange :
              c.severity === 'medium' ? Colors.accentAmber : Colors.accentGreen;
            return (
              <View key={c.crisis_id} style={[s.crisisRow, { borderLeftColor: sevColor }]}>
                <View style={s.crisisHeader}>
                  <Text style={s.crisisId}>{c.crisis_id}</Text>
                  <View style={[s.sevBadge, { backgroundColor: sevColor + '33' }]}>
                    <Text style={[s.sevText, { color: sevColor }]}>{c.severity?.toUpperCase()}</Text>
                  </View>
                  <Text style={[s.confText, { color: Colors.accentGreen }]}>{c.confidence}%</Text>
                </View>
                <Text style={s.crisisLoc}>{c.location}</Text>
                <Text style={s.crisisPop}>
                  {c.affected_population?.toLocaleString()} affected · {c.expected_duration_hours}h est.
                </Text>
              </View>
            );
          })}
        </View>
      );
    }
    case 'allocation': {
      const utilization = data.resource_utilization ?? '—';
      const allocations = data.allocations ?? [];
      return (
        <View style={s.summary}>
          <View style={s.summaryRow}>
            <View style={s.stat}>
              <Text style={[s.statValue, { color: Colors.accentGreen }]}>{utilization}</Text>
              <Text style={s.statLabel}>utilization</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statValue}>{allocations.length}</Text>
              <Text style={s.statLabel}>crises served</Text>
            </View>
          </View>
          {allocations.map((a: any) => (
            <View key={a.crisis_id} style={s.allocRow}>
              <Text style={s.allocId}>{a.crisis_id}</Text>
              <Text style={s.allocUnits}>
                {a.assigned_resources?.length ?? 0} units deployed
                {a.unmet_needs?.length > 0 ? ` · ⚠ ${a.unmet_needs.join(', ')}` : ' · all needs met'}
              </Text>
            </View>
          ))}
          {allocations[0]?.trade_off_note && (
            <View style={s.flagRow}>
              <Ionicons name="swap-horizontal" size={12} color={Colors.accentAmber} />
              <Text style={s.flagText}>{allocations[0].trade_off_note}</Text>
            </View>
          )}
        </View>
      );
    }
    case 'execution': {
      const status = data.status ?? 'executed';
      return (
        <View style={s.summary}>
          <View style={[s.execStatus, { backgroundColor: Colors.accentGreen + '22' }]}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
            <Text style={[s.execStatusText, { color: Colors.accentGreen }]}>
              {status.toUpperCase()} — {data.receipt_id ?? 'CIRO-ACTION'}
            </Text>
          </View>
          {data.before_state && (
            <View style={s.stateBlock}>
              <Text style={s.stateBefore}>BEFORE  {data.before_state}</Text>
              <Text style={s.stateArrow}>↓</Text>
              <Text style={s.stateAfter}>AFTER     {data.after_state}</Text>
            </View>
          )}
          {data.affected_count != null && (
            <Text style={s.execMeta}>
              {Number(data.affected_count).toLocaleString()} affected · PKR {data.cost_estimate_pkr ?? 0} (emergency)
            </Text>
          )}
          {data.side_effects?.length > 0 && (
            <View style={s.flagRow}>
              <Ionicons name="alert-circle" size={12} color={Colors.accentAmber} />
              <Text style={s.flagText}>{data.side_effects.join(' · ')}</Text>
            </View>
          )}
        </View>
      );
    }
    case 'verification': {
      const isFalseAlarm = data.verification_result === 'false_alarm';
      const accentColor = isFalseAlarm ? Colors.accentAmber : Colors.accentGreen;
      return (
        <View style={[s.summary, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
          <Text style={[s.summaryHeading, { color: accentColor }]}>
            {isFalseAlarm ? 'FALSE ALARM DETECTED' : 'CLASSIFICATION CONFIRMED'}
          </Text>
          <Text style={s.verifyConf}>Confidence: {data.confidence ?? '—'}%</Text>
          {data.reason && <Text style={s.verifyReason}>{data.reason}</Text>}
          {data.retraction_message && (
            <View style={[s.flagRow, { marginTop: 6 }]}>
              <Ionicons name="megaphone" size={12} color={Colors.accentAmber} />
              <Text style={[s.flagText, { color: Colors.accentAmber }]}>{data.retraction_message}</Text>
            </View>
          )}
        </View>
      );
    }
    default:
      return null;
  }
}

export default function AgentCard({ name, icon, agentKey, description }: AgentCardProps) {
  const agentStates = useCrisisStore(state => state.agentStates);
  const agentLogsMap = useCrisisStore(state => state.agentLogs);
  const fusionOutput = useCrisisStore(state => state.fusionOutput);
  const detectionOutput = useCrisisStore(state => state.detectionOutput);
  const allocationOutput = useCrisisStore(state => state.allocationOutput);
  const executionOutput = useCrisisStore(state => state.executionOutput);
  const verificationOutput = useCrisisStore(state => state.verificationOutput);

  const state = agentStates[agentKey as keyof typeof agentStates];
  const logs = agentLogsMap[agentKey] ?? [];

  const [showTrace, setShowTrace] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevStateRef = useRef<string>('idle');

  useEffect(() => {
    if (state === 'thinking' && prevStateRef.current !== 'thinking') {
      setShowTrace(true);
    }
    prevStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.25, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const getOutput = () => {
    switch (agentKey) {
      case 'fusion': return fusionOutput;
      case 'detection': return detectionOutput;
      case 'allocation': return allocationOutput;
      case 'execution': return executionOutput;
      case 'verification': return verificationOutput;
      default: return null;
    }
  };

  const output = getOutput();
  const STATUS_COLOR = state === 'thinking' ? Colors.accentRed : state === 'done' ? Colors.accentGreen : state === 'error' ? Colors.accentAmber : Colors.textMuted;
  const STATUS_LABEL = state === 'thinking' ? 'PROCESSING' : state === 'done' ? 'COMPLETE' : state === 'error' ? 'ERROR' : 'IDLE';

  const cardBorder = state === 'thinking'
    ? pulseAnim.interpolate({ inputRange: [0.25, 1], outputRange: [Colors.border, Colors.accentRed] })
    : state === 'done' ? Colors.accentGreen + '55' : Colors.border;

  return (
    <Animated.View style={[styles.card, { borderColor: cardBorder }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
        <View style={styles.statusCol}>
          <Animated.View style={[styles.statusDot, { backgroundColor: STATUS_COLOR, opacity: state === 'thinking' ? pulseAnim : 1 }]} />
          <Text style={[styles.statusLabel, { color: STATUS_COLOR }]}>{STATUS_LABEL}</Text>
        </View>
      </View>

      {/* Thinking bar */}
      {state === 'thinking' && (
        <Animated.View style={[styles.thinkingBar, { borderColor: pulseAnim.interpolate({ inputRange: [0.25, 1], outputRange: ['rgba(255,45,59,0.1)', 'rgba(255,45,59,0.5)'] }) }]}>
          <Animated.View style={[styles.thinkingDot, { opacity: pulseAnim }]} />
          <Text style={styles.thinkingText}>AI agent is reasoning...</Text>
        </Animated.View>
      )}

      {/* Live reasoning trace */}
      {showTrace && logs.length > 0 && (
        <View style={styles.logBox}>
          <Text style={styles.logHeader}>{'> '} REASONING TRACE</Text>
          {logs.slice(-10).map((line, i) => (
            <Text key={i} style={[styles.logLine, i === logs.length - 1 && state === 'thinking' && { color: Colors.textPrimary }]}>
              {'  '}{line}
            </Text>
          ))}
        </View>
      )}

      {/* Human-readable summary when done */}
      {state === 'done' && output && (
        <AgentSummary agentKey={agentKey} output={output} />
      )}

      {/* Toggle raw trace */}
      {state === 'done' && logs.length > 0 && (
        <TouchableOpacity style={styles.traceToggle} onPress={() => setShowTrace(v => !v)}>
          <Ionicons name={showTrace ? 'chevron-up' : 'code-slash'} size={12} color={Colors.textMuted} />
          <Text style={styles.traceToggleText}>{showTrace ? 'Hide trace' : 'Show reasoning trace'}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 5,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { fontSize: 22, marginRight: 10, marginTop: 2 },
  name: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  desc: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statusCol: { alignItems: 'center', marginLeft: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 3 },
  statusLabel: { fontSize: 8, fontWeight: 'bold', letterSpacing: 0.8 },
  thinkingBar: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,45,59,0.08)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  thinkingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentRed, marginRight: 8 },
  thinkingText: { color: Colors.accentRed, fontSize: 11, fontFamily: 'monospace' },
  logBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.25)',
  },
  logHeader: { color: Colors.textMuted, fontSize: 9, letterSpacing: 1, fontWeight: 'bold', marginBottom: 6, fontFamily: 'monospace' },
  logLine: { color: '#64748b', fontFamily: 'monospace', fontSize: 11, lineHeight: 17 },
  traceToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  traceToggleText: { color: Colors.textMuted, fontSize: 11, marginLeft: 5 },
});

const s = StyleSheet.create({
  summary: { marginTop: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  stat: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  summaryHeading: { fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  crisisRow: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 8 },
  crisisHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  crisisId: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginRight: 8 },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  sevText: { fontSize: 10, fontWeight: 'bold' },
  confText: { fontSize: 12, fontWeight: 'bold' },
  crisisLoc: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  crisisPop: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  allocRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(30,41,59,0.5)' },
  allocId: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 12 },
  allocUnits: { color: Colors.textPrimary, fontSize: 12 },
  flagRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  flagText: { color: Colors.textMuted, fontSize: 11, marginLeft: 6, flex: 1 },
  execStatus: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, padding: 8, marginBottom: 8 },
  execStatusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 8, fontFamily: 'monospace' },
  stateBlock: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 10, marginBottom: 6 },
  stateBefore: { color: Colors.accentRed, fontSize: 11, fontFamily: 'monospace' },
  stateArrow: { color: Colors.textMuted, textAlign: 'center', marginVertical: 4 },
  stateAfter: { color: Colors.accentGreen, fontSize: 11, fontFamily: 'monospace' },
  execMeta: { color: Colors.textMuted, fontSize: 11 },
  verifyConf: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  verifyReason: { color: Colors.textPrimary, fontSize: 12, fontStyle: 'italic' },
});
