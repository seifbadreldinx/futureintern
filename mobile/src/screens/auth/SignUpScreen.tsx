import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { AuthStackParamList } from '../../types';
import GoogleLogo from '../../components/GoogleLogo';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

const INTEREST_OPTIONS = [
  'Web Development', 'AI', 'Cyber Security', 'Business',
  'Marketing', 'Data Science', 'Design', 'Product Management',
  'Consulting', 'Research', 'Healthcare', 'Education', 'Media & Communications',
];

type UserType = 'student' | 'company';
type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'> };



export default function SignUpScreen({ navigation }: Props) {
  const { loginWithGoogle } = useAuth();
  const { isDark, toggleTheme, C } = useTheme();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>('student');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [cvFile, setCvFile] = useState<{ name: string; uri: string; size?: number } | null>(null);
  const [cvLater, setCvLater] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
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

  // ── Password strength checks ──────────────────────────────────────────────
  const pwdChecks = [
    { ok: password.length >= 8, label: 'At least 8 characters' },
    { ok: /[a-zA-Z]/.test(password), label: 'At least one letter' },
    { ok: /\d/.test(password), label: 'At least one number' },
    { ok: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'At least one special character' },
  ];

  // ── Interest toggle ───────────────────────────────────────────────────────
  const toggleInterest = (i: string) => {
    setInterests(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i);
      if (prev.length >= 3) return prev;
      return [...prev, i];
    });
  };

  // ── Pick CV ───────────────────────────────────────────────────────────────
  const pickCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('File too large', 'Please upload a file smaller than 5MB.');
          return;
        }
        setCvFile({ name: file.name, uri: file.uri, size: file.size });
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (userType === 'student' && !name.trim()) e.name = 'Full name is required';
    if (userType === 'company' && !companyName.trim()) e.companyName = 'Company name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (!pwdChecks.every(c => c.ok)) e.password = 'Password does not meet requirements';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (userType === 'student') {
      if (!university.trim()) e.university = 'University is required';
      if (interests.length !== 3) e.interests = 'Please select exactly 3 interests';
    } else {
      if (!industry) e.industry = 'Industry is required';
      if (!location.trim()) e.location = 'Location is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = async () => {
    if (!cvFile && !cvLater && userType === 'student') {
      Alert.alert('CV Required', 'Please upload your CV or check "I will add my CV later".');
      return;
    }
    setSubmitError('');
    setLoading(true);
    try {
      if (userType === 'student') {
        await api.auth.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          university: university.trim() || 'Not specified',
          major: major.trim() || 'Not specified',
          interests,
        });
        if (cvFile) {
          try { await api.auth.uploadCV(cvFile.uri, cvFile.name); } catch {}
        }
      } else {
        await api.auth.register({
          name: companyName.trim(),
          email: email.trim().toLowerCase(),
          password,
          university: 'Company',
          major: industry || 'Other',
        });
      }
      setRegisteredEmail(email.trim().toLowerCase());
      setRegistrationComplete(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Post-registration success screen ─────────────────────────────────────
  if (registrationComplete) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.primary} />
        </View>
        <Text style={styles.successTitle}>Registration Successful!</Text>
        <Text style={styles.successSub}>
          We've sent a verification link to{'\n'}
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>{registeredEmail}</Text>
          {'\n'}Please check your inbox to verify your account.
        </Text>
        <TouchableOpacity style={styles.goLoginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.goLoginText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const STEP_LABELS = userType === 'student'
    ? ['Account', 'Interests', 'CV Upload']
    : ['Account', 'Company', 'Profile'];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Theme toggle */}
      <TouchableOpacity
        style={{
          position: 'absolute', top: Platform.OS === 'ios' ? 56 : 16, right: 20, zIndex: 20,
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
        }}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color="#fff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? handleBack() : navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Start your journey to find the perfect internship</Text>
        </View>

        <View style={styles.form}>
          {/* Progress stepper */}
          <View style={styles.stepperRow}>
            {[1, 2, 3].map(s => (
              <View key={s} style={styles.stepperItem}>
                <View style={[
                  styles.stepCircle,
                  s < step && styles.stepDone,
                  s === step && styles.stepActive,
                ]}>
                  {s < step
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={[styles.stepNum, s === step && { color: '#fff' }]}>{s}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, s <= step && styles.stepLabelActive]}>
                  {STEP_LABELS[s - 1]}
                </Text>
                {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineDone]} />}
              </View>
            ))}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <View>
              {/* User type toggle */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, userType === 'student' && styles.toggleBtnActive]}
                  onPress={() => { setUserType('student'); setErrors({}); }}
                >
                  <View style={[styles.toggleIcon, userType === 'student' && styles.toggleIconActive]}>
                    <Ionicons name="school" size={20} color={userType === 'student' ? '#fff' : Colors.gray400} />
                  </View>
                  <Text style={[styles.toggleLabel, userType === 'student' && styles.toggleLabelActive]}>STUDENT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, userType === 'company' && styles.toggleBtnActiveBlue]}
                  onPress={() => { setUserType('company'); setErrors({}); }}
                >
                  <View style={[styles.toggleIcon, userType === 'company' && styles.toggleIconBlue]}>
                    <Ionicons name="business" size={20} color={userType === 'company' ? '#fff' : Colors.gray400} />
                  </View>
                  <Text style={[styles.toggleLabel, userType === 'company' && styles.toggleLabelActiveBlue]}>COMPANY</Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <FieldLabel label={userType === 'student' ? 'FULL NAME' : 'COMPANY NAME'} error={errors.name || errors.companyName} />
              <InputBox
                icon="person-outline" placeholder={userType === 'student' ? 'Your Name' : 'e.g. FutureTech Inc.'}
                value={userType === 'student' ? name : companyName}
                onChangeText={userType === 'student' ? setName : setCompanyName}
                error={!!(errors.name || errors.companyName)}
              />

              {/* Email */}
              <FieldLabel label="EMAIL ADDRESS" error={errors.email} />
              <InputBox icon="mail-outline" placeholder="Enter your email" value={email}
                onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={!!errors.email} />

              {/* Password */}
              <FieldLabel label="PASSWORD" error={errors.password} />
              <InputBox icon="lock-closed-outline" placeholder="••••••••" value={password}
                onChangeText={setPassword} secure={!showPwd}
                rightIcon={showPwd ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowPwd(v => !v)} error={!!errors.password} />
              <View style={styles.pwdChecks}>
                {pwdChecks.map(({ ok, label }) => (
                  <View key={label} style={styles.pwdCheck}>
                    <Ionicons name={ok ? 'checkmark' : 'close'} size={12} color={ok ? '#10b981' : Colors.gray400} />
                    <Text style={[styles.pwdCheckLabel, { color: ok ? '#10b981' : Colors.gray400 }]}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Confirm Password */}
              <FieldLabel label="CONFIRM PASSWORD" error={errors.confirmPassword} />
              <InputBox icon="lock-closed-outline" placeholder="••••••••" value={confirmPassword}
                onChangeText={setConfirmPassword} secure={!showConfirmPwd}
                rightIcon={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowConfirmPwd(v => !v)} error={!!errors.confirmPassword} />

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>NEXT STEP</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google button — official design */}
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
                    <GoogleLogo size={22} />
                    <Text style={styles.googleBtnText}>SIGN UP WITH GOOGLE</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <View>
              {userType === 'student' ? (
                <>
                  <Text style={styles.sectionHeading}>Pick Exactly 3 Interests</Text>
                  <View style={styles.interestsGrid}>
                    {INTEREST_OPTIONS.map(i => {
                      const selected = interests.includes(i);
                      const disabled = !selected && interests.length >= 3;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.interestChip, selected && styles.interestChipSelected, disabled && styles.interestChipDisabled]}
                          onPress={() => !disabled && toggleInterest(i)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.interestText, selected && styles.interestTextSelected]}>{i}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.interestProgress}>
                    <View style={styles.interestProgressBar}>
                      <View style={[styles.interestProgressFill, { width: `${(interests.length / 3) * 100}%` }]} />
                    </View>
                    <Text style={styles.interestCount}>{interests.length} / 3 Selected</Text>
                  </View>
                  {errors.interests && <Text style={styles.errorText}>{errors.interests}</Text>}

                  <FieldLabel label="UNIVERSITY NAME" error={errors.university} />
                  <InputBox icon="school-outline" placeholder="e.g. Cairo University"
                    value={university} onChangeText={setUniversity} error={!!errors.university} />

                  <FieldLabel label="ACADEMIC MAJOR" />
                  <InputBox icon="library-outline" placeholder="e.g. Computer Science"
                    value={major} onChangeText={setMajor} />
                </>
              ) : (
                <>
                  <FieldLabel label="INDUSTRY" error={errors.industry} />
                  <View style={[styles.inputBox, errors.industry && styles.inputBoxError]}>
                    <Ionicons name="briefcase-outline" size={18} color={Colors.gray400} style={{ marginRight: 8 }} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing & Advertising',
                        'Engineering', 'Design', 'Non-Profit', 'Media & Entertainment', 'Other'
                      ].map(ind => (
                        <TouchableOpacity key={ind} onPress={() => setIndustry(ind)}
                          style={[styles.inlineChip, industry === ind && styles.inlineChipSelected]}>
                          <Text style={[styles.inlineChipText, industry === ind && { color: '#fff' }]}>{ind}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  {industry ? <Text style={styles.selectedValue}>Selected: {industry}</Text> : null}

                  <FieldLabel label="LOCATION" error={errors.location} />
                  <InputBox icon="location-outline" placeholder="e.g. Cairo, Egypt"
                    value={location} onChangeText={setLocation} error={!!errors.location} />
                </>
              )}

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backNavBtn} onPress={handleBack}>
                  <Ionicons name="chevron-back" size={18} color={Colors.text} />
                  <Text style={styles.backNavText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1, marginLeft: 12 }]} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.nextBtnText}>CONTINUE</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── STEP 3 ─── */}
          {step === 3 && (
            <View>
              {userType === 'student' ? (
                <>
                  <Text style={styles.sectionHeading}>Upload Your CV</Text>
                  <Text style={styles.sectionSub}>Your CV helps our AI match you with relevant internships.</Text>

                  {!cvFile ? (
                    <TouchableOpacity style={styles.cvUploadBox} onPress={pickCV} activeOpacity={0.8}>
                      <Ionicons name="cloud-upload-outline" size={36} color={Colors.gray400} />
                      <Text style={styles.cvUploadTitle}>Tap to upload</Text>
                      <Text style={styles.cvUploadSub}>PDF or DOCX · Max 5MB</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cvFileBox}>
                      <Ionicons name="document-text" size={30} color="#3b82f6" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cvFileName} numberOfLines={1}>{cvFile.name}</Text>
                        {cvFile.size && <Text style={styles.cvFileSize}>{(cvFile.size / 1024 / 1024).toFixed(2)} MB</Text>}
                      </View>
                      <TouchableOpacity onPress={() => setCvFile(null)}>
                        <Ionicons name="close-circle" size={22} color={Colors.gray400} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={styles.cvLaterRow} onPress={() => setCvLater(v => !v)}>
                    <View style={[styles.checkbox, cvLater && styles.checkboxChecked]}>
                      {cvLater && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.cvLaterText}>I will add my CV later in the profile settings</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <FieldLabel label="COMPANY DESCRIPTION" />
                  <TextInput
                    style={styles.textarea}
                    value={major}
                    onChangeText={setMajor}
                    placeholder="Share your company's mission and what you do..."
                    placeholderTextColor={Colors.gray400}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </>
              )}

              {submitError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={16} color={Colors.red} />
                  <Text style={styles.errorBoxText}>{submitError}</Text>
                </View>
              ) : null}

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backNavBtn} onPress={handleBack} disabled={loading}>
                  <Ionicons name="chevron-back" size={18} color={Colors.text} />
                  <Text style={styles.backNavText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { flex: 1, marginLeft: 12 }, loading && styles.btnDisabled]}
                  onPress={handleSubmit} disabled={loading} activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <>
                      <Text style={styles.nextBtnText}>CREATE ACCOUNT</Text>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────

function FieldLabel({ label, error }: { label: string; error?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 14 }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 }}>{label}</Text>
      {error && <Text style={{ fontSize: FontSize.xs, color: Colors.red, fontWeight: '600' }}>{error}</Text>}
    </View>
  );
}

function InputBox({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secure, rightIcon, onRightPress, error }: any) {
  return (
    <View style={[styles.inputBox, error && styles.inputBoxError]}>
      <Ionicons name={icon} size={18} color={Colors.gray400} style={{ marginRight: 8 }} />
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
        secureTextEntry={secure}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
          <Ionicons name={rightIcon} size={18} color={Colors.gray400} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 32,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white, marginBottom: 4 },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  form: { padding: Spacing.lg },

  // Stepper
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  stepperItem: { flex: 1, alignItems: 'center', flexDirection: 'row', position: 'relative' },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.gray100, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.gray400 },
  stepLabel: { fontSize: 9, color: Colors.gray400, fontWeight: '700', textTransform: 'uppercase', marginLeft: 4, letterSpacing: 0.3 },
  stepLabelActive: { color: Colors.text },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginLeft: 4 },
  stepLineDone: { backgroundColor: Colors.primary },
  progressBar: { height: 6, backgroundColor: Colors.gray100, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  // User type toggle
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  toggleBtn: {
    flex: 1, padding: 16, borderRadius: Radius.lg, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  toggleBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  toggleBtnActiveBlue: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  toggleIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    borderWidth: 2, borderColor: Colors.border,
  },
  toggleIconActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleIconBlue: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  toggleLabel: { fontSize: 11, fontWeight: '800', color: Colors.gray400, letterSpacing: 0.5 },
  toggleLabelActive: { color: '#fff' },
  toggleLabelActiveBlue: { color: '#fff' },

  // Input
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, height: 52,
    marginBottom: 4,
  },
  inputBoxError: { borderColor: Colors.red },
  inputText: { flex: 1, fontSize: FontSize.base, color: Colors.text },

  // Password checks
  pwdChecks: { marginBottom: 4 },
  pwdCheck: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  pwdCheckLabel: { fontSize: FontSize.xs, fontWeight: '600' },

  // Next/Back buttons
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, height: 52,
    marginTop: Spacing.lg,
  },
  nextBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800', letterSpacing: 0.5 },
  navRow: { flexDirection: 'row', marginTop: Spacing.lg },
  backNavBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 16, height: 52, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  backNavText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },

  btnDisabled: { opacity: 0.6 },

  // Divider + Google
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderWidth: 2, borderColor: '#dadce0',
    borderRadius: Radius.md, height: 52, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  googleLogoBox: {
    width: 22, height: 22, borderRadius: 11, marginRight: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#dadce0',
  },
  googleLogoBlue: { fontSize: 15, fontWeight: '900', color: '#4285F4' },
  googleBtnText: { fontSize: FontSize.sm, fontWeight: '800', color: '#3c4043', letterSpacing: 0.3 },

  // Login row
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.md },
  loginPrompt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  loginLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },

  // Interests
  sectionHeading: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 16 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  interestChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  interestChipSelected: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  interestChipDisabled: { opacity: 0.35 },
  interestText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  interestTextSelected: { color: '#fff' },
  interestProgress: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  interestProgressBar: { flex: 1, height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  interestProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  interestCount: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.textSecondary },

  // Inline industry chips
  inlineChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.white,
  },
  inlineChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  inlineChipText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  selectedValue: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700', marginTop: 6, marginBottom: 4 },

  // CV
  cvUploadBox: {
    borderWidth: 2.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.lg, padding: 40, alignItems: 'center',
    backgroundColor: Colors.white, marginBottom: 12,
  },
  cvUploadTitle: { fontSize: FontSize.base, fontWeight: '800', color: Colors.text, marginTop: 12 },
  cvUploadSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  cvFileBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderRadius: Radius.lg, padding: 16,
    borderWidth: 2, borderColor: '#bfdbfe', marginBottom: 12,
  },
  cvFileName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  cvFileSize: { fontSize: FontSize.xs, color: '#6366f1', fontWeight: '600', marginTop: 2 },
  cvLaterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cvLaterText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  textarea: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.lg,
    padding: 14, fontSize: FontSize.base, color: Colors.text,
    backgroundColor: Colors.white, minHeight: 120, marginBottom: 12,
  },

  // Error box
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: Radius.md, padding: 12,
    borderWidth: 1, borderColor: '#fecaca', marginBottom: 8,
  },
  errorBoxText: { fontSize: FontSize.sm, color: Colors.red, flex: 1 },
  errorText: { fontSize: FontSize.xs, color: Colors.red, fontWeight: '600', marginBottom: 8 },

  // Success
  successContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  successIconBox: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.text, marginBottom: 12 },
  successSub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  goLoginBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 14, paddingHorizontal: 48,
  },
  goLoginText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },
});
