import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Crisis } from '../store/crisisStore';

interface Props {
  crisis: Crisis;
}

export default function CrisisCard({ crisis }: Props) {
  const getIcon = (type: string) => {
    if (type.includes('flood')) return '🌊';
    if (type.includes('fire')) return '🔥';
    if (type.includes('accident')) return '💥';
    if (type.includes('heatwave')) return '🌡️';
    if (type.includes('power')) return '⚡';
    if (type.includes('collapse') || type.includes('infra')) return '🚧';
    return '⚠️';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return Colors.accentRed;
      case 'high': return Colors.accentOrange;
      case 'medium': return Colors.accentAmber;
      case 'low': return Colors.accentGreen;
      default: return Colors.textMuted;
    }
  };

  const severityColor = getSeverityColor(crisis.severity);

  return (
    <View style={[styles.card, crisis.severity === 'critical' && styles.criticalBorder]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getIcon(crisis.type)}</Text>
        <Text style={styles.location}>{crisis.location}</Text>
        <View style={[styles.badge, { backgroundColor: `${severityColor}33` }]}>
          <Text style={[styles.badgeText, { color: severityColor }]}>{crisis.severity.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>CONFIDENCE</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${crisis.confidence * 100}%` }]} />
          </View>
          <Text style={styles.statValue}>{(crisis.confidence * 100).toFixed(0)}%</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AFFECTED</Text>
          <Text style={styles.statValue}>{crisis.affected_population.toLocaleString()}</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DURATION</Text>
          <Text style={styles.statValue}>{crisis.expected_duration_hours}h</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  criticalBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.accentRed,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  location: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  progressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentGreen,
  },
});
