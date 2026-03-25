import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { AuthStackParamList } from '../../types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) { setError('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-open-outline" size={32} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSub}>We'll send a reset link to your email</Text>
        </View>

        <View style={styles.form}>
          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.green} style={styles.successIcon} />
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successText}>
                We've sent a password reset link to{'\n'}<Text style={styles.successEmail}>{email}</Text>
              </Text>
              <Text style={styles.successHint}>
                Check your inbox and spam folder. The link expires in 1 hour.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                  <Ionicons name="mail-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.gray400}
                    value={email}
                    onChangeText={v => { setEmail(v); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.primaryBtnText}>Send Reset Link</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLinkBtn}>
                <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 32,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { marginBottom: 16 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { padding: Spacing.lg, paddingTop: Spacing.xl },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  fieldGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, height: 50,
  },
  inputError: { borderColor: Colors.red },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: FontSize.base, color: Colors.text },
  errorText: { fontSize: FontSize.xs, color: Colors.red, marginTop: 4 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  backLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backLinkText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  successBox: { alignItems: 'center', paddingTop: Spacing.xl },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: FontSize['2xl'], fontWeight: '800', color: Colors.text, marginBottom: 8 },
  successText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  successEmail: { color: Colors.text, fontWeight: '700' },
  successHint: { fontSize: FontSize.sm, color: Colors.gray400, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
});
