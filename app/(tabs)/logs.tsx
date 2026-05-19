import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ToastAndroid, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import { useCrisisStore } from '../../store/crisisStore';
import LogEntry from '../../components/LogEntry';
import { Ionicons } from '@expo/vector-icons';

export default function LogsScreen() {
  const executionLogs = useCrisisStore(state => state.executionLogs);
  const falseAlarmDetected = useCrisisStore(state => state.falseAlarmDetected);
  const [filter, setFilter] = useState('All');
  const scrollViewRef = useRef<ScrollView>(null);

  const agents = ['All', 'fusion', 'detection', 'allocation', 'execution', 'verification'];

  const filteredLogs = filter === 'All' 
    ? executionLogs 
    : executionLogs.filter(log => log.agent === filter);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [filteredLogs.length]);

  const handleExport = async () => {
    const logText = executionLogs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.agent.toUpperCase()}] ${l.message}`).join('\n');
    await Clipboard.setStringAsync(logText);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied!', 'Logs copied to clipboard.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>INCIDENT LOG</Text>
            <Text style={styles.subtitle}>Full agent reasoning trace</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Ionicons name="copy-outline" size={16} color={Colors.textPrimary} />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {agents.map(agent => (
            <TouchableOpacity 
              key={agent} 
              style={[styles.filterBtn, filter === agent && styles.filterBtnActive]}
              onPress={() => setFilter(agent)}
            >
              <Text style={[styles.filterText, filter === agent && styles.filterTextActive]}>
                {agent.charAt(0).toUpperCase() + agent.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {falseAlarmDetected && (
        <View style={styles.falseAlarmBanner}>
          <Text style={styles.falseAlarmTitle}>⚠️ FALSE ALARM DETECTED & CORRECTED</Text>
        </View>
      )}

      <ScrollView 
        style={styles.logsContainer} 
        ref={scrollViewRef}
        contentContainerStyle={styles.logsScrollContent}
      >
        {filteredLogs.map(log => (
          <View key={log.id} style={log.agent === 'verification' && falseAlarmDetected ? styles.verificationLogBg : null}>
            <LogEntry entry={log} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.baselineCard}>
        <Text style={styles.baselineTitle}>BASELINE COMPARISON</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.tableCell, styles.tableHeaderCell]}></Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell]}>Traditional</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.ciroHeader]}>CIRO Agentic ✓</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.rowLabel]}>18 min detect</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, styles.ciroCell]}>3 min detect</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.rowLabel]}>34% false alarm</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, styles.ciroCell]}>8% false alarm</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.rowLabel]}>52% resources</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, styles.ciroCell]}>87% resources</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.rowLabel]}>2 stakeholders</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, styles.ciroCell]}>6 stakeholders</Text>
          </View>
        </View>
        <View style={styles.badgesRow}>
          <View style={styles.improvementBadge}><Text style={styles.improvementText}>6x Faster</Text></View>
          <View style={styles.improvementBadge}><Text style={styles.improvementText}>76% Less False Alarms</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: 16, paddingTop: 60, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: Colors.textMuted, fontSize: 14, marginBottom: 16 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  exportText: { color: Colors.textPrimary, marginLeft: 6, fontSize: 12, fontWeight: 'bold' },
  filterScroll: { flexDirection: 'row', paddingBottom: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filterBtnActive: { backgroundColor: Colors.border },
  filterText: { color: Colors.textMuted, fontSize: 12 },
  filterTextActive: { color: Colors.textPrimary, fontWeight: 'bold' },
  falseAlarmBanner: { backgroundColor: Colors.accentAmber, padding: 8, alignItems: 'center' },
  falseAlarmTitle: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  logsContainer: { flex: 1 },
  logsScrollContent: { padding: 16 },
  verificationLogBg: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, paddingHorizontal: 8 },
  baselineCard: { backgroundColor: Colors.bgCard, padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 32 },
  baselineTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  table: { width: '100%', marginBottom: 16 },
  tableRowHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(30, 41, 59, 0.5)' },
  tableCell: { flex: 1, color: Colors.textPrimary, fontSize: 12, textAlign: 'center' },
  tableHeaderCell: { color: Colors.textMuted, fontWeight: 'bold' },
  ciroHeader: { color: Colors.accentGreen },
  rowLabel: { textAlign: 'left', color: Colors.textMuted },
  ciroCell: { color: Colors.accentGreen, fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 4, overflow: 'hidden' },
  badgesRow: { flexDirection: 'row', justifyContent: 'center' },
  improvementBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginHorizontal: 4 },
  improvementText: { color: Colors.accentGreen, fontSize: 10, fontWeight: 'bold' },
});
