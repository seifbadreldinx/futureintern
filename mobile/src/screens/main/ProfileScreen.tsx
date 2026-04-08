import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, Switch, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, C } = useTheme();
  const styles = makeStyles(C);

  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try { await logout(); }
            finally { setLoggingOut(false); }
          },
        },
      ]
    );
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'light'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Student'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {(user?.university || user?.major) && (
            <Text style={styles.university}>
              {[user?.major, user?.university].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        {/* Points card */}
        <TouchableOpacity style={styles.pointsCard} activeOpacity={0.85} onPress={() => navigation.navigate('Points')}>
          <View style={styles.pointsLeft}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <View>
              <Text style={styles.pointsValue}>{user?.points ?? 0}</Text>
              <Text style={styles.pointsLabel}>Points Balance</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.gray400} />
        </TouchableOpacity>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <MenuItem C={C} icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
            <Divider C={C} />
            <MenuItem C={C} icon="document-text-outline" label="My CV" onPress={() => navigation.navigate('CVBuilder')} />
            <Divider C={C} />
            <MenuItem C={C} icon="briefcase-outline" label="My Applications" onPress={() => navigation.navigate('Applications', { filter: 'all' })} />
            <Divider C={C} />
            <MenuItem C={C} icon="star-outline" label="Points & Rewards" onPress={() => navigation.navigate('Points')} />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            {/* Dark mode toggle */}
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: isDark ? '#7c3aed20' : '#7c3aed20' }]}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={18}
                    color="#7c3aed"
                  />
                </View>
                <Text style={styles.menuLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.gray200, true: '#7c3aed60' }}
                thumbColor={isDark ? '#7c3aed' : C.gray400}
              />
            </View>
            <Divider C={C} />
            {/* Push notifications */}
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#3b82f620' }]}>
                  <Ionicons name="notifications-outline" size={18} color="#3b82f6" />
                </View>
                <Text style={styles.menuLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: C.gray200, true: C.primary + '60' }}
                thumbColor={notificationsEnabled ? C.primary : C.gray400}
              />
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem C={C} icon="help-circle-outline" label="Help Center" onPress={() => Linking.openURL('https://futureintern-two.vercel.app/get-help')} />
            <Divider C={C} />
            <MenuItem C={C} icon="chatbubble-outline" label="Contact Support" onPress={() => Linking.openURL('https://futureintern-two.vercel.app/contact')} />
            <Divider C={C} />
            <MenuItem C={C} icon="document-outline" label="Privacy Policy" onPress={() => Linking.openURL('https://futureintern-two.vercel.app/privacy-policy')} />
            <Divider C={C} />
            <MenuItem C={C} icon="shield-checkmark-outline" label="Terms of Service" onPress={() => Linking.openURL('https://futureintern-two.vercel.app/terms-of-service')} />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.85}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={C.red} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={C.red} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>FutureIntern v1.0.0</Text>
      </ScrollView>
    </>
  );
}

function MenuItem({ C, icon, label, onPress }: { C: any; icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: C.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={C.primary} />
        </View>
        <Text style={{ fontSize: FontSize.base, color: C.text, fontWeight: '500' }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.gray400} />
    </TouchableOpacity>
  );
}

function Divider({ C }: { C: any }) {
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: 60 }} />;
}

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 32,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: '900', color: '#fff' },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', marginBottom: 2 },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  university: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
  pointsCard: {
    marginHorizontal: Spacing.md,
    marginTop: -20,
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Shadow.md,
    borderWidth: 1, borderColor: C.border,
    marginBottom: Spacing.lg,
  },
  pointsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsValue: { fontSize: FontSize.xl, fontWeight: '900', color: C.text },
  pointsLabel: { fontSize: FontSize.xs, color: C.textSecondary },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: C.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: FontSize.base, color: C.text, fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: C.red + '40',
  },
  signOutText: { fontSize: FontSize.base, color: C.red, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: C.gray400, marginTop: 8 },
});
