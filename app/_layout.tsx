import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { View } from 'react-native';
import { useCrisisStore } from '../store/crisisStore';

export default function RootLayout() {
  const currentUser = useCrisisStore(s => s.currentUser);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      </Stack>
      {!currentUser && <Redirect href="/login" />}
    </View>
  );
}
