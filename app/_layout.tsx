import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { View } from 'react-native';

export default function RootLayout() {
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
      </Stack>
    </View>
  );
}
