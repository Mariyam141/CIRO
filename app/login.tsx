import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useCrisisStore } from '../store/crisisStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useCrisisStore(s => s.login);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400)); // brief visual feedback
    const ok = login(email.trim(), password);
    setLoading(false);
    if (ok) {
      router.replace('/(tabs)');
    } else {
      setError('Invalid credentials. Check email and password.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>Muhafiz</Text>
          <Text style={styles.logoSub}>Team CodeBlitz</Text>
          <Text style={styles.logoCityText}>Crisis Intelligence & Response Orchestrator</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SECURE LOGIN</Text>
          <Text style={styles.cardSub}>Authorized personnel only</Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.pk"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Login</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Demo credentials hint */}
        <View style={styles.hints}>
          <Text style={styles.hintsTitle}>DEMO CREDENTIALS</Text>
          <View style={styles.hintRow}>
            <View style={styles.hintBadge}><Text style={styles.hintBadgeText}>ADMIN</Text></View>
            <Text style={styles.hintText}>admin@ciro.pk  ·  admin123</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={[styles.hintBadge, { backgroundColor: Colors.accentBlue + '22', borderColor: Colors.accentBlue }]}>
              <Text style={[styles.hintBadgeText, { color: Colors.accentBlue }]}>USER</Text>
            </View>
            <Text style={styles.hintText}>user@ciro.pk  ·  user123</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bgPrimary },
  inner:        { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  logoSection:  { alignItems: 'center', marginBottom: 40 },
  logo:         { color: Colors.accentRed, fontSize: 48, fontWeight: 'bold', letterSpacing: 4 },
  logoSub:      { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  logoCityText: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  card:         { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  cardTitle:    { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  cardSub:      { color: Colors.textMuted, fontSize: 12, marginBottom: 20 },
  label:        { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  input:        { backgroundColor: Colors.bgPrimary, color: Colors.textPrimary, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14 },
  error:        { color: Colors.accentRed, fontSize: 12, marginBottom: 12 },
  btn:          { backgroundColor: Colors.accentRed, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  hints:        { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  hintsTitle:   { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  hintRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  hintBadge:    { backgroundColor: Colors.accentRed + '22', borderWidth: 1, borderColor: Colors.accentRed, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginRight: 10 },
  hintBadgeText:{ color: Colors.accentRed, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  hintText:     { color: Colors.textMuted, fontSize: 12, fontFamily: 'monospace' },
});
