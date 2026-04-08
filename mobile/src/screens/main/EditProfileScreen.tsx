import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator, KeyboardAvoidingView, Image,
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

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, refreshUserData } = useAuth();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [major, setMajor] = useState(user?.major || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(
    Array.isArray(user?.skills) ? user.skills.join(', ') : (user?.skills || '')
  );
  const [linkedin, setLinkedin] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.profile_image || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      // Upload to backend
      setUploadingPhoto(true);
      try {
        const token = await (await import('../../services/api')).getAuthToken();
        const form = new FormData();
        form.append('profile_image', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
        const res = await fetch('https://futureintern-production.up.railway.app/api/users/profile-image', {
          method: 'POST',
          body: form,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Upload failed');
        await refreshUserData?.();
      } catch {
        Alert.alert('Upload Failed', 'Could not upload photo. It will be saved locally for now.');
      } finally {
        setUploadingPhoto(false);
      }
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
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        linkedin: linkedin.trim(),
      });
      await refreshUserData?.();
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
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
