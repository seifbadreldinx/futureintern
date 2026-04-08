import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:     { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  reviewing:   { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  accepted:    { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  rejected:    { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  shortlisted: { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe' },
};

interface Application {
  id: number;
  internship_id: number;
  status: string;
  applied_at: string;
  internship_title?: string;
  company?: any;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const { C } = useTheme();

  const [applications, setApplications] = useState<Application[]>([]);
  const [points, setPoints] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [appsData, pointsData, savedData] = await Promise.all([
        api.applications.list().catch(() => ({ applications: [] })),
        api.points.balance().catch(() => ({ balance: 0 })),
        api.internships.listSaved().catch(() => []),
      ]);
      setApplications(appsData.applications || []);
      setPoints((pointsData as any).balance || 0);
      setSavedCount(Array.isArray(savedData) ? savedData.length : 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const total    = applications.length;
  const saved    = savedCount;
  const reviewing = applications.filter(a => ['reviewing', 'under_review', 'shortlisted'].includes(a.status)).length;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          tintColor={C.primary}
          colors={[C.primary]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={[S.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44, backgroundColor: C.card, borderBottomColor: C.border }]}>
        <View>
          <Text style={[S.dashTitle, { color: C.text }]}>DASHBOARD</Text>
        </View>
        <Text style={[S.welcomeText, { color: C.textSecondary }]}>Welcome, {user?.name || 'Student'}</Text>
      </View>

      <View style={{ padding: Spacing.md }}>
        {/* ── 4 Stat Cards (row of 4 like website) ── */}
        <View style={S.statsRow}>
          <StatCard
            label="TOTAL APPLICATIONS" value={total}
            icon="document-text-outline" color="#3b82f6"
            bg="#eff6ff"
            onPress={() => navigation.navigate('Applications', { filter: 'all' })}
            C={C}
          />
          <StatCard
            label="SAVED INTERNSHIPS" value={saved}
            icon="bookmark-outline" color="#10b981"
            bg="#f0fdf4"
            onPress={() => navigation.navigate('Main', { screen: 'Saved' } as any)}
            C={C}
          />
          <StatCard
            label="UNDER REVIEW" value={reviewing}
            icon="briefcase-outline" color="#f59e0b"
            bg="#fffbeb"
            onPress={() => navigation.navigate('Applications', { filter: 'reviewing' })}
            C={C}
          />
          <StatCard
            label="POINTS BALANCE" value={points}
            icon="star-outline" color="#f59e0b"
            bg="#fffbeb"
            onPress={() => navigation.navigate('Points')}
            C={C}
          />
        </View>

        {/* ── CV Builder Card ── */}
        <TouchableOpacity
          style={[S.cvCard, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={() => navigation.navigate('CVBuilder')}
          activeOpacity={0.85}
        >
          <View style={S.cvCardLeft}>
            <View style={S.cvIcon}>
              <Ionicons name="document-text" size={22} color="#f43f5e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cvTitle, { color: C.text }]}>CV BUILDER</Text>
              <Text style={[S.cvSub, { color: C.textSecondary }]}>
                Build your professional CV with ATS scoring &amp; 3 templates
              </Text>
            </View>
          </View>
          <Text style={S.cvLink}>Build Now →</Text>
        </TouchableOpacity>

        {/* ── Recent Applications ── */}
        <View style={[S.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[S.sectionTitle, { color: C.text }]}>RECENT APPLICATIONS</Text>

          {applications.length === 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Browse' } as any)}>
              <Text style={S.browseLink}>Browse more internships →</Text>
            </TouchableOpacity>
          ) : (
            <>
              {applications.slice(0, 5).map(app => (
                <AppRow key={app.id} app={app} C={C} />
              ))}
              <TouchableOpacity
                style={{ marginTop: 4 }}
                onPress={() => navigation.navigate('Applications', { filter: 'all' })}
              >
                <Text style={S.browseLink}>Browse more internships →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Quick Actions (keeping as secondary) ── */}
        <View style={[S.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[S.sectionTitle, { color: C.text }]}>QUICK ACTIONS</Text>
          <View style={S.actionsRow}>
            <QuickAction icon="briefcase-outline" label="Browse" color="#f43f5e" onPress={() => navigation.navigate('Main', { screen: 'Browse' } as any)} C={C} />
            <QuickAction icon="business-outline" label="Companies" color="#2563eb" onPress={() => navigation.navigate('Main', { screen: 'Companies' } as any)} C={C} />
            <QuickAction icon="bookmark-outline" label="Saved" color="#0891b2" onPress={() => navigation.navigate('Main', { screen: 'Saved' } as any)} C={C} />
            <QuickAction icon="list-outline" label="Applications" color="#7c3aed" onPress={() => navigation.navigate('Applications', { filter: 'all' })} C={C} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, bg, onPress, C }: {
  label: string; value: number; icon: any; color: string; bg: string;
  onPress: () => void; C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.8}
      style={[S.statCard, { backgroundColor: C.card, borderColor: C.border }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={[S.statLabel, { color: C.textSecondary }]}>{label}</Text>
          <Text style={[S.statValue, { color: C.text }]}>{value}</Text>
        </View>
        <View style={[S.statIconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AppRow({ app, C }: { app: Application; C: any }) {
  const status = app.status || 'pending';
  const sc = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const companyName = typeof app.company === 'object'
    ? (app.company?.name || '') : (app.company || '');
  const initial = (companyName || app.internship_title || '?').charAt(0).toUpperCase();
  const date = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={[S.appRow, { borderColor: C.border }]}>
      <View style={[S.appAvatar, { backgroundColor: C.primary + '20' }]}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: C.primary }}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.appTitle, { color: C.text }]} numberOfLines={1}>
          {app.internship_title || `Internship #${app.internship_id}`}
        </Text>
        {companyName ? (
          <Text style={[S.appCompany, { color: C.textSecondary }]} numberOfLines={1}>{companyName}</Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <View style={[S.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <Text style={[S.statusText, { color: sc.text }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
        <Text style={[S.appDate, { color: C.gray400 }]}>{date}</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress, C }: {
  icon: any; label: string; color: string; onPress: () => void; C: any;
}) {
  return (
    <TouchableOpacity
      style={[S.quickBtn, { backgroundColor: C.background, borderColor: C.border }]}
      onPress={onPress} activeOpacity={0.8}
    >
      <View style={[S.quickIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[S.quickLabel, { color: C.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 2,
  },
  dashTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  welcomeText: { fontSize: FontSize.sm, fontWeight: '500' },

  // Stat cards — 2x2 grid like website's 4-across row
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statCard: {
    width: '47.5%',
    borderRadius: Radius.md, padding: 14,
    borderWidth: 2,
  },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statIconBox: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // CV Builder card
  cvCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: Radius.md, borderWidth: 2,
    padding: 16, marginBottom: 12,
  },
  cvCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  cvIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#fff0f3', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fecdd3',
  },
  cvTitle: { fontSize: FontSize.base, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
  cvSub: { fontSize: 11, lineHeight: 16 },
  cvLink: { fontSize: FontSize.sm, fontWeight: '800', color: '#f43f5e' },

  // Sections
  section: {
    borderRadius: Radius.md, borderWidth: 2,
    padding: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  browseLink: { fontSize: FontSize.sm, color: '#3b82f6', fontWeight: '700', marginTop: 4 },

  // App row
  appRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
    gap: 10,
  },
  appAvatar: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  appTitle: { fontSize: FontSize.sm, fontWeight: '700' },
  appCompany: { fontSize: FontSize.xs, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  appDate: { fontSize: 10 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingVertical: 10, paddingHorizontal: 12,
    minWidth: '47%',
  },
  quickIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: FontSize.xs, fontWeight: '700' },
});
