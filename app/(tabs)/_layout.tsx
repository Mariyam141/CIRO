import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useCrisisStore } from '../../store/crisisStore';

export default function TabLayout() {
  const role = useCrisisStore(s => s.currentUser?.role);
  const isAdmin = role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.accentRed,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip" size={size} color={color} />,
          href: isAdmin ? '/agents' : null,
        }}
      />
      {/* Map, Actions, Alerts, Logs placeholders per spec */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="actions"
        options={{
          title: 'Actions',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
          href: isAdmin ? '/actions' : null,
        }}
      />
      <Tabs.Screen
        name="stakeholders"
        options={{
          title: 'Stakeholders',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
          href: isAdmin ? '/logs' : null,
        }}
      />
    </Tabs>
  );
}
