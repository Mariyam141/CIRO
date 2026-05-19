import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { Action } from '../store/crisisStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  action: Action;
  onSimulate: () => void;
  isExecuted: boolean;
}

export default function ActionCard({ action, onSimulate, isExecuted }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleSimulate = () => {
    onSimulate();
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const getPriorityColor = (p: number) => {
    switch(p) {
      case 1: return Colors.accentRed;
      case 2: return Colors.accentAmber;
      case 3: return Colors.accentBlue;
      default: return Colors.textMuted;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('traffic')) return 'car';
    if (type.includes('dispatch') || type.includes('rescue')) return 'medkit';
    if (type.includes('alert')) return 'megaphone';
    if (type.includes('shelter')) return 'home';
    return 'construct';
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
            <Text style={styles.priorityText}>P{action.priority}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{action.crisis_id}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            <Ionicons name={getTypeIcon(action.type) as any} size={24} color={Colors.textPrimary} />
          </View>
          <View style={styles.textContent}>
            <Text style={styles.description}>{action.description}</Text>
            <Text style={styles.impact}>Impact: {action.estimated_impact}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, isExecuted && styles.buttonDisabled]} 
          onPress={handleSimulate}
          disabled={isExecuted}
        >
          {isExecuted ? (
            <View style={styles.executedRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} style={{marginRight: 8}} />
              <Text style={[styles.buttonText, { color: Colors.accentGreen }]}>Executed</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Simulate Execution</Text>
          )}
        </TouchableOpacity>
      </View>

      {isExecuted && (
        <Animated.View style={[
          styles.receiptCard,
          {
            opacity: slideAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}>
          <Text style={styles.receiptTitle}>RECEIPT: {action.id}-{Date.now().toString().slice(-4)}</Text>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>State:</Text>
            <Text style={styles.receiptValue}>Pending ➔ Active</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Effect:</Text>
            <Text style={[styles.receiptValue, { color: Colors.accentGreen }]}>{action.estimated_impact.split(',')[0]}</Text>
          </View>
          {action.priority === 1 && (
            <Text style={styles.sideEffect}>Warning: Resources severely depleted.</Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tag: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  description: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  impact: {
    color: Colors.accentGreen,
    fontSize: 12,
  },
  button: {
    backgroundColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  executedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  receiptCard: {
    backgroundColor: '#111827',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    paddingTop: 24,
    marginTop: -12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    zIndex: 1,
  },
  receiptTitle: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  receiptValue: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  sideEffect: {
    color: Colors.accentAmber,
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
