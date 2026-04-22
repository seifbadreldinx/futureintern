import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator, KeyboardAvoidingView, Image, Linking, Animated,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

const API_BASE = 'https://futureintern-production.up.railway.app';
const FRONTEND_BASE = 'https://futureintern-two.vercel.app';

function resolveLogoUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const match = url.match(/\/uploads\/logos\/(.+)$/);
    if (match) return `${API_BASE}/uploads/logos/${match[1]}`;
    return url;
  }
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  if (url.startsWith('/logos/')) return `${FRONTEND_BASE}${url}`;
  return null;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

/** Unwrap skills regardless of how many times it was JSON-encoded by the backend */
function parseSkillsToString(raw: any): string {
  if (!raw) return '';
  let val: any = raw;
  for (let i = 0; i < 6; i++) {
    if (Array.isArray(val)) return val.map(String).filter(Boolean).join(', ');
    if (typeof val !== 'string') return String(val);
    const t = val.trim();
    if (t.startsWith('[') || t.startsWith('"')) {
      try { val = JSON.parse(t); continue; } catch { break; }
    }
    return val; // plain comma-separated string
  }
  if (Array.isArray(val)) return val.map(String).filter(Boolean).join(', ');
  return typeof val === 'string' ? val : '';
}

export default function EditProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, refreshUserData } = useAuth();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [major, setMajor] = useState(user?.major || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(() => parseSkillsToString(user?.skills));
  const [linkedin, setLinkedin] = useState('');
  const [saving, setSaving] = useState(false);
  // photoKey is bumped after each upload to bust React Native's image cache
  const [photoKey, setPhotoKey] = useState(() => Date.now());
  const [photoUri, setPhotoUri] = useState<string | null>(() => {
    const url = resolveLogoUrl(user?.profile_image);
    return url ? `${url}?k=${Date.now()}` : null;
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // NOTE: no useEffect syncing photoUri from user context —
  // we keep the local asset.uri preview after upload so the
  // image never flickers to a cached server URL.

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const pickPhoto = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose a source:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '📷 Camera',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert('Permission Required', 'Please enable camera access in Settings → FutureIntern.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true, aspect: [1, 1], quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) doUpload(result.assets[0]);
            } catch (e: any) {
              Alert.alert('Camera Error', e?.message || 'Could not open camera.');
            }
          },
        },
        {
          text: '🖼️ Photo Library',
          onPress: async () => {
            try {
              // Request both permission types for max compatibility
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert(
                  'Permission Required',
                  'Please enable Photos access: Settings → Privacy → Photos → FutureIntern → All Photos.',
                  [
                    { text: 'OK' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                  ]
                );
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, aspect: [1, 1], quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) doUpload(result.assets[0]);
            } catch (e: any) {
              Alert.alert('Gallery Error', e?.message || 'Could not open photo library.');
            }
          },
        },
      ]
    );
  };

  const doUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setPhotoUri(asset.uri);
    setUploadingPhoto(true);
    try {
      const { getAuthToken } = await import('../../services/api');
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated. Please log in again.');

      // Normalize URI — Android sometimes returns content:// URI
      let uri = asset.uri;
      if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('http')) {
        uri = 'file://' + uri;
      }

      const form = new FormData();
      form.append('logo', {
        uri,
        type: asset.mimeType || 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const res = await fetch('https://futureintern-production.up.railway.app/api/users/upload-logo', {
        method: 'POST',
        body: form,
        headers: {
          // Do NOT set Content-Type — fetch appends multipart boundary automatically
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Upload failed (HTTP ${res.status})`);
      }

      // Keep showing the local asset.uri — it already has the correct new image.
      // DO NOT switch to the server URL here: React Native caches by URL and the
      // filename is the same on every upload (logo_{id}_profile.jpg), so loading
      // the server URL would show the old cached photo.
      // Bump photoKey so ProfileScreen will also reload with cache-busting.
      setPhotoKey(Date.now());

      await refreshUserData?.();
      showToast('Photo updated successfully!', true);
    } catch (err: any) {
      showToast(err?.message || 'Could not upload photo. Please try again.', false);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    setSaving(true);
    try {
      await api.auth.updateProfile({
        name: name.trim(),
        university: university.trim(),
        major: major.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean).join(', '),
        linkedin: linkedin.trim(),
      });
      await refreshUserData?.();
      showToast('Profile updated successfully!', true);
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile.', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrapper} activeOpacity={0.85}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {uploadingPhoto
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={18} color="#fff" />
            }
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <View style={styles.card}>
          <Field label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" C={C} />
          <Sep C={C} />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+20 100 000 0000" keyboardType="phone-pad" C={C} />
          <Sep C={C} />
          <Field label="Location" value={location} onChangeText={setLocation} placeholder="Cairo, Egypt" C={C} />
        </View>

        {/* Education */}
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.card}>
          <Field label="University" value={university} onChangeText={setUniversity} placeholder="Cairo University" C={C} />
          <Sep C={C} />
          <Field label="Major" value={major} onChangeText={setMajor} placeholder="Computer Science" C={C} />
        </View>

        {/* Professional */}
        <Text style={styles.sectionTitle}>Professional</Text>
        <View style={styles.card}>
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            C={C}
          />
          <Sep C={C} />
          <Field
            label="Skills"
            value={skills}
            onChangeText={setSkills}
            placeholder="Python, React, SQL (comma separated)"
            C={C}
          />
          <Sep C={C} />
          <Field
            label="LinkedIn"
            value={linkedin}
            onChangeText={setLinkedin}
            placeholder="linkedin.com/in/yourname"
            keyboardType="url"
            autoCapitalize="none"
            C={C}
          />
        </View>

        <TouchableOpacity style={styles.saveFullBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveFullText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

    {/* ── Toast ── */}
    {toast && (
      <Animated.View
        style={[
          {
            position: 'absolute', bottom: 40, left: 24, right: 24,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 14,
            borderRadius: 14, borderWidth: 2,
            backgroundColor: toast.ok ? '#f0fdf4' : '#fef2f2',
            borderColor: toast.ok ? '#16a34a' : '#dc2626',
            shadowColor: '#0f172a', shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.18, shadowRadius: 0, elevation: 6,
          },
          { opacity: toastOpacity },
        ]}
      >
        <Ionicons
          name={toast.ok ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={toast.ok ? '#16a34a' : '#dc2626'}
        />
        <Text style={{ flex: 1, marginLeft: 10, fontWeight: '700', fontSize: 14, color: toast.ok ? '#166534' : '#991b1b' }}>
          {toast.msg}
        </Text>
        <TouchableOpacity onPress={() => setToast(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={toast.ok ? '#166534' : '#991b1b'} />
        </TouchableOpacity>
      </Animated.View>
    )}
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, numberOfLines,
  keyboardType, autoCapitalize, C,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; numberOfLines?: number;
  keyboardType?: any; autoCapitalize?: any; C: any;
}) {
  return (
    <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 12 }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.gray300}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        multiline={multiline}
        numberOfLines={multiline ? (numberOfLines || 4) : 1}
        style={{
          fontSize: FontSize.base,
          color: C.text,
          padding: 0,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 80 : undefined,
        }}
      />
    </View>
  );
}

function Sep({ C }: { C: any }) {
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: Spacing.md }} />;
}

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { padding: 4, marginRight: 16 },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  saveBtn: { padding: 4 },
  saveText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  avatarSection: {
    backgroundColor: C.primary,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarWrapper: { position: 'relative' },
  avatarImage: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: { fontSize: FontSize['2xl'], fontWeight: '900', color: '#fff' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  scroll: { padding: Spacing.md, paddingBottom: 60 },
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: '700', color: C.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8, marginTop: Spacing.md,
  },
  card: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', ...Shadow.sm,
  },
  saveFullBtn: {
    backgroundColor: C.primary, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveFullText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
