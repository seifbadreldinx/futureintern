import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
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
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
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
      <View style={styles.pointsCard}>
        <View style={styles.pointsLeft}>
          <Ionicons name="star" size={20} color="#f59e0b" />
          <View style={styles.pointsTextBox}>
            <Text style={styles.pointsValue}>{user?.points ?? 0}</Text>
            <Text style={styles.pointsLabel}>Points Balance</Text>
          </View>
        </View>
        <View style={styles.pointsRight}>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
        </View>
      </View>

      {/* Account section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <MenuDivider />
          <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
          <MenuDivider />
          <MenuItem icon="document-text-outline" label="My CV" onPress={() => {}} />
          <MenuDivider />
          <MenuItem icon="briefcase-outline" label="My Applications" onPress={() => {}} />
        </View>
      </View>

      {/* Preferences section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#3b82f6' + '20' }]}>
                <Ionicons name="notifications-outline" size={18} color="#3b82f6" />
              </View>
              <Text style={styles.menuLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.gray200, true: Colors.primary + '60' }}
              thumbColor={notificationsEnabled ? Colors.primary : Colors.gray400}
            />
          </View>
        </View>
      </View>

      {/* Support section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <MenuDivider />
          <MenuItem icon="chatbubble-outline" label="Contact Support" onPress={() => {}} />
          <MenuDivider />
          <MenuItem icon="document-outline" label="Privacy Policy" onPress={() => {}} />
          <MenuDivider />
          <MenuItem icon="shield-checkmark-outline" label="Terms of Service" onPress={() => {}} />
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
          {loggingOut
            ? <ActivityIndicator size="small" color={Colors.red} />
            : (
              <>
                <Ionicons name="log-out-outline" size={20} color={Colors.red} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>FutureIntern v1.0.0</Text>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '20' }]}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
    </TouchableOpacity>
  );
}

function MenuDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: Colors.primary,
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
  avatarText: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  university: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
  pointsCard: {
    marginHorizontal: Spacing.md,
    marginTop: -20,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  pointsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsTextBox: {},
  pointsValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  pointsLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  pointsRight: {},
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: FontSize.base, color: Colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.red + '40',
  },
  signOutText: { fontSize: FontSize.base, color: Colors.red, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.gray400, marginTop: 8 },
});
