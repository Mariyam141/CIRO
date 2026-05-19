import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export type Stakeholder = {
  id: string;
  type: "public" | "hospital" | "emergency" | "utility" | "transport" | "media";
  name: string;
  message: string;
  priority: "high" | "medium" | "low";
  sent: boolean;
};

interface Props {
  stakeholder: Stakeholder;
  onSend: () => void;
}

export default function StakeholderCard({ stakeholder, onSend }: Props) {
  const getIcon = (type: string) => {
    switch(type) {
      case 'public': return '👥';
      case 'hospital': return '🏥';
      case 'emergency': return '🚒';
      case 'utility': return '⚡';
      case 'transport': return '🚌';
      case 'media': return '📺';
      default: return '📢';
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return Colors.accentRed;
      case 'medium': return Colors.accentAmber;
      case 'low': return Colors.accentBlue;
      default: return Colors.textMuted;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{getIcon(stakeholder.type)}</Text>
          <View>
            <Text style={styles.name}>{stakeholder.name}</Text>
            <Text style={styles.type}>{stakeholder.type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(stakeholder.priority) }]}>
          <Text style={styles.priorityText}>{stakeholder.priority}</Text>
        </View>
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.message} numberOfLines={2}>{stakeholder.message}</Text>
      </View>

      {stakeholder.sent ? (
        <View style={styles.sentContainer}>
          <Ionicons name="checkmark-done" size={16} color={Colors.accentGreen} />
          <Text style={styles.sentText}>Sent at {new Date().toLocaleTimeString()}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Text style={styles.sendButtonText}>Send Notification</Text>
          <Ionicons name="send" size={14} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  type: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
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
    textTransform: 'uppercase',
  },
  messageContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  message: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  sendButton: {
    backgroundColor: Colors.accentBlue,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  sentText: {
    color: Colors.accentGreen,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});
