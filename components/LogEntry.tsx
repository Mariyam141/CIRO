import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LogEntry as LogEntryType } from '../store/crisisStore';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  entry: LogEntryType;
}

export default function LogEntry({ entry }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const getStatusIcon = () => {
    switch (entry.status) {
      case 'success': return <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />;
      case 'warning': return <Ionicons name="warning" size={16} color={Colors.accentAmber} />;
      case 'error': return <Ionicons name="close-circle" size={16} color={Colors.accentRed} />;
      case 'info':
      default: return <Ionicons name="information-circle" size={16} color={Colors.accentBlue} />;
    }
  };

  const getAgentColor = () => {
    switch (entry.agent) {
      case 'fusion': return Colors.accentBlue;
      case 'detection': return Colors.accentOrange;
      case 'allocation': return Colors.accentAmber;
      case 'execution': return Colors.accentRed;
      case 'verification': return Colors.accentGreen;
      default: return Colors.textPrimary;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.headerRow}>
        <Text style={styles.timestamp}>{new Date(entry.timestamp).toLocaleTimeString()}</Text>
        <Text style={[styles.agentName, { color: getAgentColor() }]}>{entry.agent.toUpperCase()}</Text>
      </View>
      <View style={styles.messageRow}>
        {getStatusIcon()}
        <Text style={styles.message}>{entry.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  agentName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: Colors.textPrimary,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
