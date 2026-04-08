import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { AuthStackParamList } from '../../types';

WebBrowser.maybeCompleteAuthSession();

// TODO: Replace with your Google Web Client ID (the value of VITE_GOOGLE_CLIENT_ID from the web app)
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'> };

export default function SignUpScreen({ navigation }: Props) {
  const { refreshUserData, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', university: '', major: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) {
        setGoogleLoading(true);
        loginWithGoogle(token)
          .catch((err: any) => Alert.alert('Google Sign Up Failed', err.message || 'Please try again.'))
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [response]);

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.university.trim()) e.university = 'University is required';
    if (!form.major.trim()) e.major = 'Major is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.auth.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        university: form.university.trim(),
        major: form.major.trim(),
      });
      await refreshUserData();
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields: Array<{
    key: keyof typeof form; label: string; placeholder: string;
    keyboard?: any; secure?: boolean; icon: any;
  }> = [
    { key: 'name', label: 'Full Name', placeholder: 'Ahmed Hassan', icon: 'person-outline' },
    { key: 'email', label: 'Email', placeholder: 'you@example.com', keyboard: 'email-address', icon: 'mail-outline' },
    { key: 'password', label: 'Password', placeholder: 'Min. 8 characters', secure: true, icon: 'lock-closed-outline' },
    { key: 'university', label: 'University', placeholder: 'Cairo University', icon: 'school-outline' },
    { key: 'major', label: 'Major', placeholder: 'Computer Science', icon: 'library-outline' },
  ];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join thousands of students finding internships</Text>
        </View>

        <View style={styles.form}>
          {/* Google Sign Up */}
          <TouchableOpacity
            style={[styles.googleBtn, (googleLoading || !request) && styles.btnDisabled]}
            onPress={() => promptAsync()}
            disabled={googleLoading || !request}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {fields.map(({ key, label, placeholder, keyboard, secure, icon }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={[styles.inputWrapper, errors[key] ? styles.inputError : null]}>
                <Ionicons name={icon} size={18} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.gray400}
                  value={form[key]}
                  onChangeText={set(key)}
                  keyboardType={keyboard || 'default'}
                  autoCapitalize={key === 'email' ? 'none' : 'words'}
                  autoCorrect={false}
                  secureTextEntry={secure && !showPassword}
                />
                {secure && (
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                  </TouchableOpacity>
                )}
              </View>
              {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { padding: Spacing.lg, paddingTop: Spacing.xl },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    marginBottom: Spacing.md,
  },
  googleBtnText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: FontSize.sm, color: Colors.textSecondary },
  fieldGroup: { marginBottom: Spacing.md },
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
  eyeBtn: { padding: 4 },
  errorText: { fontSize: FontSize.xs, color: Colors.red, marginTop: 4 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginPrompt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  loginLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
});
