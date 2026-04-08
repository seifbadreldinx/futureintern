import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius } from '../../constants/theme';
import { AuthStackParamList, RootStackParamList } from '../../types';
import GoogleLogo from '../../components/GoogleLogo';
import { useNavigation } from '@react-navigation/native';

const GOOGLE_OAUTH_URL = 'https://futureintern-production.up.railway.app/api/auth/google/mobile';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { login, loginWithTokens } = useAuth();
  const { isDark, toggleTheme, C } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(GOOGLE_OAUTH_URL, 'futureintern://');
      if (result.type === 'success') {
        const url = result.url;
        const query = url.includes('?') ? url.split('?')[1] : '';
        const params = Object.fromEntries(query.split('&').map(p => p.split('=').map(decodeURIComponent)));
        if (params.error) {
          Alert.alert('Google Login Failed', params.error);
        } else if (params.token) {
          await loginWithTokens(params.token, params.refresh_token || '');
        }
      }
    } catch (err: any) {
      Alert.alert('Google Login Failed', err.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const S = makeStyles(C, isDark);

  return (
    <SafeAreaView style={S.safe}>
      {/* Chatbot FAB */}
      <TouchableOpacity
        style={S.fab}
        onPress={() => { try { rootNav.navigate('Chatbot'); } catch {} }}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="robot" size={24} color="#fff" />
        <View style={S.fabBadge}><Text style={S.fabBadgeText}>AI</Text></View>
      </TouchableOpacity>

      {/* Theme toggle — top right */}
      <TouchableOpacity style={S.themeBtn} onPress={toggleTheme} activeOpacity={0.8}>
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={C.textSecondary} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View style={S.logoRow}>
            <View style={S.logoIconBox}>
              <Ionicons name="school" size={28} color="#fff" />
            </View>
            <Text style={S.logoText}>
              <Text style={S.logoFuture}>FUTURE</Text>
              <Text style={S.logoIntern}>INTERN</Text>
            </Text>
          </View>

          {/* ── Heading ── */}
          <Text style={S.heading}>WELCOME BACK</Text>
          <Text style={S.subheading}>Sign in to continue your journey</Text>

          {/* ── Form Card ── */}
          <View style={S.card}>
            {/* Email */}
            <Text style={S.label}>EMAIL ADDRESS</Text>
            <View style={[S.inputWrap, errors.email ? S.inputErr : null]}>
              <View style={S.inputIconBox}>
                <Ionicons name="mail-outline" size={16} color="#2563eb" />
              </View>
              <TextInput
                style={S.input}
                placeholder="Enter your email"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            {errors.email && <Text style={S.errTxt}>{errors.email}</Text>}

            {/* Password */}
            <Text style={[S.label, { marginTop: 16 }]}>PASSWORD</Text>
            <View style={[S.inputWrap, errors.password ? S.inputErr : null]}>
              <View style={[S.inputIconBox, { backgroundColor: '#fff1f2' }]}>
                <Ionicons name="lock-closed-outline" size={16} color="#f43f5e" />
              </View>
              <TextInput
                style={S.input}
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 6 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={S.errTxt}>{errors.password}</Text>}

            {/* Remember me + Forgot */}
            <View style={S.rememberRow}>
              <TouchableOpacity
                style={S.checkboxRow}
                onPress={() => setRememberMe(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[S.checkbox, rememberMe && S.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
                <Text style={S.rememberText}>REMEMBER ME</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={S.forgotText}>FORGOT?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In button */}
            <TouchableOpacity
              style={[S.signInBtn, loading && S.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.signInBtnText}>SIGN IN</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={S.divider}>
              <View style={S.divLine} />
              <Text style={S.divText}>OR CONTINUE WITH</Text>
              <View style={S.divLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={[S.googleBtn, googleLoading && S.btnDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading
                ? <ActivityIndicator color={C.text} />
                : (
                  <>
                    <GoogleLogo size={22} />
                    <Text style={S.googleBtnText}>SIGN IN WITH GOOGLE</Text>
                  </>
                )
              }
            </TouchableOpacity>

            {/* Bottom line */}
            <View style={S.bottomLine} />
          </View>

          {/* Sign Up link */}
          <View style={S.signupRow}>
            <Text style={S.signupPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={S.signupLink}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  themeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // Logo row
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 },
  logoIconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  logoFuture: { color: C.text },
  logoIntern: { color: '#f43f5e' },

  // Heading
  heading: {
    fontSize: 28, fontWeight: '900', color: C.text,
    letterSpacing: 1, textAlign: 'center', marginBottom: 8,
  },
  subheading: {
    fontSize: FontSize.base, color: C.textSecondary,
    textAlign: 'center', marginBottom: 32,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: C.black,
    padding: 24,
    shadowColor: C.black,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    marginBottom: 24,
  },

  label: {
    fontSize: 11, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 0.8, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.background,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: Radius.md, overflow: 'hidden',
    height: 50,
  },
  inputErr: { borderColor: '#f43f5e' },
  inputIconBox: {
    width: 44, height: '100%',
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, fontSize: FontSize.base, color: C.text,
    paddingHorizontal: 12,
  },
  errTxt: { fontSize: FontSize.xs, color: '#f43f5e', marginTop: 4 },

  // Remember me row
  rememberRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16, marginBottom: 20,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 16, height: 16, borderRadius: 3,
    borderWidth: 2, borderColor: C.gray300,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.background,
  },
  checkboxChecked: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  rememberText: { fontSize: 11, fontWeight: '700', color: C.textSecondary, letterSpacing: 0.5 },
  forgotText: { fontSize: 11, fontWeight: '800', color: '#f43f5e', letterSpacing: 0.5 },

  // Sign In button
  signInBtn: {
    backgroundColor: '#f43f5e',
    height: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  signInBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800', letterSpacing: 1 },
  btnDisabled: { opacity: 0.6 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: {
    marginHorizontal: 10, fontSize: 10,
    fontWeight: '700', color: C.textMuted, letterSpacing: 0.6,
  },

  // Google button
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: Radius.md,
    backgroundColor: '#fff', gap: 10,
    marginBottom: 20,
    // Add subtle shadow instead of heavy border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1, borderColor: '#e2e8f0', // Very light border that blends in
  },
  googleBtnText: {
    fontSize: FontSize.base, fontWeight: '900', // Made bold/heavy like screenshot
    color: '#0f172a', letterSpacing: 0, // Solid dark blue/black
  },

  bottomLine: { height: 1.5, backgroundColor: C.black, opacity: 0.08 },

  // Signup row
  signupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signupPrompt: { fontSize: FontSize.sm, color: C.textSecondary },
  signupLink: { fontSize: FontSize.sm, fontWeight: '800', color: '#f43f5e' },

  // Chatbot FAB
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    zIndex: 999,
    borderWidth: 2, borderColor: '#f43f5e',
  },
  fabBadge: {
    position: 'absolute', top: -2, right: -4,
    minWidth: 20, height: 18, borderRadius: 9,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0f172a',
    paddingHorizontal: 3,
  },
  fabBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
});
