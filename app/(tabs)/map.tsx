import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle, Polyline, Callout } from 'react-native-maps';
import { Colors } from '../../constants/colors';
import { useCrisisStore } from '../../store/crisisStore';
const resourcesData = require('../../backend/mock_data/resources.json');

function crisisEmoji(type: string, isFalseAlarm: boolean) {
  if (isFalseAlarm) return '⚠️';
  if (type?.includes('flood'))    return '🌊';
  if (type?.includes('heat'))     return '🌡️';
  if (type?.includes('fire'))     return '🔥';
  if (type?.includes('accident')) return '💥';
  if (type?.includes('power'))    return '⚡';
  if (type?.includes('water'))    return '💧';
  return '🚨';
}

function severityColor(severity: string, isFalseAlarm: boolean) {
  if (isFalseAlarm) return Colors.accentAmber;
  switch (severity) {
    case 'critical': return Colors.accentRed;
    case 'high':     return Colors.accentOrange ?? '#f97316';
    case 'medium':   return Colors.accentAmber;
    default:         return Colors.accentGreen;
  }
}

export default function MapScreen() {
  const activeCrises      = useCrisisStore(state => state.activeCrises);
  const allocationOutput  = useCrisisStore(state => state.allocationOutput);
  const falseAlarmDetected = useCrisisStore(state => state.falseAlarmDetected);
  const [showAfter, setShowAfter] = useState(false);

  const rescueTeams = resourcesData.rescue_teams || [];
  const medicalTeams = resourcesData.medical_teams || [];
  const shelters = resourcesData.emergency_shelters || [];

  const totalAffected = activeCrises.reduce((sum, c) => sum + (c.affected_population ?? 0), 0);
  const allocData = allocationOutput?.data ?? allocationOutput;
  const utilization = allocData?.resource_utilization
    ? parseInt(allocData.resource_utilization)
    : activeCrises.length > 0 ? 87 : 0;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 24.8607,
          longitude: 67.0011,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        userInterfaceStyle="dark"
        mapType="standard"
      >
        {/* Crises rendering — show primary crisis zone only */}
        {activeCrises.slice(0, 1).map((crisis, index) => {
          const isFalseAlarm = falseAlarmDetected && index === 0;
          const color  = severityColor(crisis.severity, isFalseAlarm);
          const emoji  = crisisEmoji(crisis.type, isFalseAlarm);
          const radius = (crisis as any).affected_radius_km
            ? (crisis as any).affected_radius_km * 1000
            : crisis.severity === 'critical' ? 2500 : crisis.severity === 'high' ? 4000 : 1500;

          return (
            <React.Fragment key={`crisis-${index}`}>
              <Circle
                center={{ latitude: crisis.coordinates?.lat ?? 24.8607, longitude: crisis.coordinates?.lng ?? 67.0011 }}
                radius={radius}
                fillColor={`${color}33`}
                strokeColor={color}
                strokeWidth={2}
              />
              <Marker coordinate={{ latitude: crisis.coordinates?.lat ?? 24.8607, longitude: crisis.coordinates?.lng ?? 67.0011 }}>
                <View style={[styles.markerContainer, { borderColor: color }]}>
                  <Text style={styles.markerEmoji}>{emoji}</Text>
                </View>
                <Callout style={styles.callout}>
                  <Text style={styles.calloutTitle}>{isFalseAlarm ? 'RECLASSIFIED' : crisis.type?.replace(/_/g, ' ').toUpperCase()}</Text>
                  <Text style={styles.calloutText}>{crisis.location}</Text>
                  <Text style={styles.calloutText}>Severity: {crisis.severity}</Text>
                  <Text style={styles.calloutText}>Affected: {crisis.affected_population?.toLocaleString()}</Text>
                </Callout>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Resources rendering */}
{rescueTeams.map((team: any, i: number) => (
  <Marker key={`rescue-${i}`} coordinate={{
    latitude: team.coordinates?.lat ?? 24.8607,
    longitude: team.coordinates?.lng ?? 67.0011,
  }}>
    <View style={[styles.resourceMarker, { backgroundColor: Colors.accentRed }]}>
      <Text style={styles.resourceEmoji}>🚒</Text>
    </View>
  </Marker>
))}
{medicalTeams.map((team: any, i: number) => (
  <Marker key={`medical-${i}`} coordinate={{
    latitude: team.coordinates?.lat ?? 24.8607,
    longitude: team.coordinates?.lng ?? 67.0011,
  }}>
    <View style={[styles.resourceMarker, { backgroundColor: Colors.accentGreen }]}>
      <Text style={styles.resourceEmoji}>🚑</Text>
    </View>
  </Marker>
))}
{shelters.map((shelter: any, i: number) => (
  <Marker key={`shelter-${i}`} coordinate={{
    latitude: shelter.coordinates?.lat ?? 24.8607,
    longitude: shelter.coordinates?.lng ?? 67.0011,
  }}>
    <View style={[styles.resourceMarker, { backgroundColor: Colors.accentBlue }]}>
      <Text style={styles.resourceEmoji}>🏠</Text>
    </View>
  </Marker>
))}

        {/* Before / After state lines */}
        {activeCrises.length > 0 && !showAfter && (
          <Polyline
            coordinates={[
              { latitude: 24.98, longitude: 67.03 },
              { latitude: 24.92, longitude: 67.09 }
            ]}
            strokeColor={Colors.accentRed}
            strokeWidth={4}
          />
        )}
        {activeCrises.length > 0 && showAfter && (
          <Polyline
            coordinates={[
              { latitude: 24.98, longitude: 67.03 },
              { latitude: 24.95, longitude: 67.12 },
              { latitude: 24.92, longitude: 67.09 }
            ]}
            strokeColor={Colors.accentGreen}
            strokeWidth={4}
            lineDashPattern={[10, 10]}
          />
        )}
      </MapView>

      {/* Top Overlay Card */}
      <View style={styles.topCard}>
        <View style={styles.topCardStat}>
          <Text style={styles.statLabel}>ACTIVE CRISES</Text>
          <Text style={styles.statValue}>{activeCrises.length}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.topCardStat}>
          <Text style={styles.statLabel}>AFFECTED</Text>
          <Text style={styles.statValue}>{totalAffected.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.topCardStat}>
          <Text style={styles.statLabel}>RESOURCES</Text>
          <Text style={styles.statValue}>{utilization}%</Text>
        </View>
      </View>

      {/* Bottom Toggle Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.toggleButton, !showAfter && styles.toggleActive]} 
          onPress={() => setShowAfter(false)}
        >
          <Text style={[styles.toggleText, !showAfter && styles.toggleTextActive]}>BEFORE</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, showAfter && styles.toggleActive]} 
          onPress={() => setShowAfter(true)}
        >
          <Text style={[styles.toggleText, showAfter && styles.toggleTextActive]}>AFTER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  markerContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  markerEmoji: { fontSize: 20 },
  resourceMarker: {
    padding: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  resourceEmoji: { fontSize: 12 },
  callout: {
    width: 150,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
  },
  topCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  topCardStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    height: '100%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: Colors.border,
  },
  toggleText: {
    color: Colors.textMuted,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },
});
