import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { Colors } from '../../constants/colors';
import AgentCard from '../../components/AgentCard';
import { useCrisisStore } from '../../store/crisisStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PIPELINE_STEPS = [
  { key: 'fusion',       icon: '📡', label: 'Signal\nFusion' },
  { key: 'detection',    icon: '🔍', label: 'Crisis\nDetect' },
  { key: 'allocation',   icon: '⚡', label: 'Resource\nAlloc' },
  { key: 'execution',    icon: '🚀', label: 'Action\nExec' },
  { key: 'verification', icon: '✅', label: 'Verify' },
];

function PipelineHeader() {
  const agentStates = useCrisisStore(state => state.agentStates);
  const isDemoRunning = useCrisisStore(state => state.isDemoRunning);
  const livePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isDemoRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(livePulse, { toValue: 0.2, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(livePulse, { toValue: 1,   duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else {
      livePulse.stopAnimation();
      livePulse.setValue(1);
    }
  }, [isDemoRunning, livePulse]);

  const activeIndex = PIPELINE_STEPS.findIndex(s => agentStates[s.key as keyof typeof agentStates] === 'thinking');
  const doneCount   = PIPELINE_STEPS.filter(s => agentStates[s.key as keyof typeof agentStates] === 'done').length;
  const allDone     = doneCount === PIPELINE_STEPS.length;

  const stepColor = (key: string) => {
    const st = agentStates[key as keyof typeof agentStates];
    if (st === 'done')     return Colors.accentGreen;
    if (st === 'thinking') return Colors.accentRed;
    if (st === 'error')    return Colors.accentAmber;
    return Colors.border;
  };

  return (
    <View style={ph.wrapper}>
      {/* Title row */}
      <View style={ph.titleRow}>
        <Text style={ph.title}>AGENTIC PIPELINE</Text>
        {isDemoRunning ? (
          <View style={ph.liveBadge}>
            <Animated.View style={[ph.liveDot, { opacity: livePulse }]} />
            <Text style={ph.liveText}>LIVE</Text>
          </View>
        ) : allDone ? (
          <View style={[ph.liveBadge, { backgroundColor: Colors.accentGreen + '22', borderColor: Colors.accentGreen }]}>
            <Ionicons name="checkmark-circle" size={10} color={Colors.accentGreen} />
            <Text style={[ph.liveText, { color: Colors.accentGreen, marginLeft: 4 }]}>COMPLETE</Text>
          </View>
        ) : null}
      </View>

      {/* Steps */}
      <View style={ph.stepsRow}>
        {PIPELINE_STEPS.map((step, i) => {
          const st = agentStates[step.key as keyof typeof agentStates];
          const color = stepColor(step.key);
          const isActive = st === 'thinking';
          return (
            <React.Fragment key={step.key}>
              <View style={ph.step}>
                <View style={[
                  ph.circle,
                  { borderColor: color, backgroundColor: st === 'done' ? color + '25' : 'transparent' },
                  isActive && { borderWidth: 2, borderColor: Colors.accentRed },
                ]}>
                  {st === 'done'
                    ? <Ionicons name="checkmark" size={14} color={Colors.accentGreen} />
                    : <Text style={ph.stepIcon}>{step.icon}</Text>
                  }
                </View>
                <Text style={[ph.stepLabel, { color }]}>{step.label}</Text>
              </View>
              {i < PIPELINE_STEPS.length - 1 && (
                <View style={[
                  ph.arrow,
                  { backgroundColor: agentStates[PIPELINE_STEPS[i + 1].key as keyof typeof agentStates] !== 'idle' ? Colors.accentGreen + '88' : Colors.border },
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Active step label */}
      {activeIndex >= 0 && (
        <Text style={ph.activeLabel}>
          Step {activeIndex + 1} / {PIPELINE_STEPS.length} — {['Signal Fusion', 'Crisis Detection', 'Resource Allocation', 'Action Execution', 'Verification'][activeIndex]}
        </Text>
      )}
    </View>
  );
}

function CompletionCard() {
  const router = useRouter();
  const agentStates     = useCrisisStore(state => state.agentStates);
  const activeCrises    = useCrisisStore(state => state.activeCrises);
  const executedActions = useCrisisStore(state => state.executedActions);
  const falseAlarm      = useCrisisStore(state => state.falseAlarmDetected);
  const allDone = PIPELINE_STEPS.every(s => agentStates[s.key as keyof typeof agentStates] === 'done');
  if (!allDone) return null;

  const totalAffected = activeCrises.reduce((sum, c) => sum + (c.affected_population ?? 0), 0);

  return (
    <View style={cc.card}>
      <Text style={cc.title}>CRISIS RESPONSE ACTIVE</Text>
      <View style={cc.statsRow}>
        <View style={cc.stat}>
          <Text style={cc.statValue}>{activeCrises.length}</Text>
          <Text style={cc.statLabel}>Crises{'\n'}Detected</Text>
        </View>
        <View style={cc.divider} />
        <View style={cc.stat}>
          <Text style={cc.statValue}>{totalAffected > 0 ? (totalAffected / 1000).toFixed(0) + 'K' : '—'}</Text>
          <Text style={cc.statLabel}>Persons{'\n'}Affected</Text>
        </View>
        <View style={cc.divider} />
        <View style={cc.stat}>
          <Text style={cc.statValue}>{executedActions.length}</Text>
          <Text style={cc.statLabel}>Actions{'\n'}Executed</Text>
        </View>
        <View style={cc.divider} />
        <View style={cc.stat}>
          <Text style={[cc.statValue, { color: falseAlarm ? Colors.accentAmber : Colors.accentGreen }]}>
            {falseAlarm ? '⚠️' : '✅'}
          </Text>
          <Text style={cc.statLabel}>{falseAlarm ? 'False\nAlarm' : 'Verified'}</Text>
        </View>
      </View>

      <Text style={cc.exploreLabel}>EXPLORE RESULTS</Text>
      <View style={cc.navRow}>
        {[
          { tab: '/(tabs)/map',          icon: 'map',           label: 'Crisis Map' },
          { tab: '/(tabs)/actions',      icon: 'flash',         label: 'Actions' },
          { tab: '/(tabs)/stakeholders', icon: 'notifications', label: 'Alerts' },
          { tab: '/(tabs)/logs',         icon: 'document-text', label: 'Logs' },
        ].map(({ tab, icon, label }) => (
          <TouchableOpacity key={tab} style={cc.navBtn} onPress={() => router.push(tab as any)}>
            <Ionicons name={icon as any} size={18} color={Colors.accentRed} />
            <Text style={cc.navLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function AgentsScreen() {
  const falseAlarmDetected = useCrisisStore(state => state.falseAlarmDetected);
  const scrollRef = useRef<ScrollView>(null);
  const agentStates = useCrisisStore(state => state.agentStates);

  useEffect(() => {
    const anyActive = Object.values(agentStates).some(s => s === 'thinking' || s === 'done');
    if (anyActive) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [agentStates.fusion]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      bounces={false}
      contentContainerStyle={styles.scrollContent}
    >
      <PipelineHeader />

      <View style={styles.pipeline}>
        <AgentCard name="Signal Fusion"       icon="📡" agentKey="fusion"       description="Ingests & scores signals from social, weather, traffic" />
        <View style={styles.connector}><Ionicons name="caret-down" size={14} color={Colors.accentRed} /></View>

        <AgentCard name="Crisis Detection"    icon="🔍" agentKey="detection"    description="Classifies crisis type, severity, population impact" />
        <View style={styles.connector}><Ionicons name="caret-down" size={14} color={Colors.accentRed} /></View>

        <AgentCard name="Resource Allocation" icon="⚡" agentKey="allocation"   description="Optimizes constrained resource deployment across crises" />
        <View style={styles.connector}><Ionicons name="caret-down" size={14} color={Colors.accentRed} /></View>

        <AgentCard name="Action Execution"    icon="🚀" agentKey="execution"    description="Simulates traffic rerouting, dispatch, public alerts" />
        <View style={styles.connector}><Ionicons name="caret-down" size={14} color={Colors.accentRed} /></View>

        <View style={{ opacity: falseAlarmDetected ? 1 : 0.55 }}>
          <AgentCard name="Verification"      icon="✅" agentKey="verification" description="Detects false alarms, issues retractions if needed" />
        </View>
      </View>

      <CompletionCard />

      {/* Baseline Comparison */}
      <View style={styles.baselineCard}>
        <Text style={styles.baselineTitle}>BASELINE COMPARISON</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.cellHeader, { textAlign: 'left', flex: 1.4 }]}>Metric</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Traditional</Text>
          <Text style={[styles.cell, styles.cellHeader, { color: Colors.accentGreen }]}>CIRO Agentic</Text>
        </View>
        {[
          ['Detection time',    '18 min',  '3 min'],
          ['False alarm rate',  '34%',     '8%'],
          ['Resource usage',    '52%',     '87%'],
          ['Stakeholders hit',  '2',       '6'],
        ].map(([metric, trad, ciro]) => (
          <View key={metric} style={styles.tableRow}>
            <Text style={[styles.cell, { textAlign: 'left', color: Colors.textMuted, flex: 1.4 }]}>{metric}</Text>
            <Text style={styles.cell}>{trad}</Text>
            <Text style={[styles.cell, styles.ciroCell]}>{ciro}</Text>
          </View>
        ))}
        <View style={styles.badgesRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>6x Faster</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>76% Fewer False Alarms</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>3x Stakeholders</Text></View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollContent: { paddingBottom: 40, paddingTop: 50 },
  pipeline: { paddingHorizontal: 16 },
  connector:   { alignItems: 'center', marginVertical: -4, zIndex: 1 },
  baselineCard: { margin: 16, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  baselineTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 4 },
  tableRow:   { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(30,41,59,0.4)' },
  cell:       { flex: 1, color: Colors.textPrimary, fontSize: 12, textAlign: 'center' },
  cellHeader: { color: Colors.textMuted, fontWeight: 'bold' },
  ciroCell:   { color: Colors.accentGreen, fontWeight: 'bold', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 4, overflow: 'hidden' },
  badgesRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' },
  badge:      { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, margin: 4 },
  badgeText:  { color: Colors.accentGreen, fontSize: 10, fontWeight: 'bold' },
});

const ph = StyleSheet.create({
  wrapper:     { margin: 16, marginBottom: 8, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  titleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:       { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,45,59,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.accentRed },
  liveDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentRed, marginRight: 5 },
  liveText:    { color: Colors.accentRed, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  stepsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  step:        { alignItems: 'center', flex: 1 },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  stepIcon:    { fontSize: 16 },
  stepLabel:   { fontSize: 9, textAlign: 'center', lineHeight: 12 },
  arrow:       { height: 2, flex: 0.3, borderRadius: 1, marginBottom: 14 },
  activeLabel: { color: Colors.accentRed, fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },
});

const cc = StyleSheet.create({
  card:        { margin: 16, marginTop: 4, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.accentGreen + '55' },
  title:       { color: Colors.accentGreen, fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5, marginBottom: 14 },
  statsRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat:        { alignItems: 'center', flex: 1 },
  statValue:   { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  statLabel:   { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 3 },
  divider:     { width: 1, backgroundColor: Colors.border },
  exploreLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  navRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  navBtn:      { flex: 1, alignItems: 'center', backgroundColor: Colors.border, borderRadius: 10, padding: 10, marginHorizontal: 3 },
  navLabel:    { color: Colors.textPrimary, fontSize: 10, marginTop: 5, textAlign: 'center' },
});
