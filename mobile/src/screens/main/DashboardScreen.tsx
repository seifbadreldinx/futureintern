import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { TabScreenNavProp } from '../../types';

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
  const navigation = useNavigation<TabScreenNavProp>();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [applications, setApplications] = useState<Application[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [appsData, pointsData] = await Promise.all([
        api.applications.list(),
        api.points.balance(),
      ]);
      setApplications(appsData.applications || []);
      setPoints(pointsData.balance || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Student'} 👋</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.pointsText}>{points} pts</Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard C={C} label="Total"     value={stats.total}     icon="briefcase-outline"        color={C.primary} onPress={() => navigation.navigate('Applications', { filter: 'all' })} />
        <StatCard C={C} label="Pending"   value={stats.pending}   icon="time-outline"             color="#f59e0b"   onPress={() => navigation.navigate('Applications', { filter: 'pending' })} />
        <StatCard C={C} label="Reviewing" value={stats.reviewing} icon="eye-outline"              color="#3b82f6"   onPress={() => navigation.navigate('Applications', { filter: 'reviewing' })} />
        <StatCard C={C} label="Accepted"  value={stats.accepted}  icon="checkmark-circle-outline" color="#10b981"  onPress={() => navigation.navigate('Applications', { filter: 'accepted' })} />
      </View>

      {/* Recent Applications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          {applications.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('Applications', { filter: 'all' })}>
              <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {applications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="briefcase-outline" size={32} color={C.gray400} />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptySubtitle}>Start applying to internships to track them here</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Browse')}>
              <Text style={styles.browseBtnText}>Browse Internships</Text>
            </TouchableOpacity>
          </View>
        ) : (
          applications.slice(0, 5).map(app => <AppRow key={app.id} app={app} C={C} />)
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction C={C} icon="briefcase-outline"   label="Browse Jobs"    color={C.primary} onPress={() => navigation.navigate('Browse')} />
          <QuickAction C={C} icon="business-outline"    label="Companies"      color="#2563eb"   onPress={() => navigation.navigate('Companies')} />
          <QuickAction C={C} icon="document-text-outline" label="My CV"        color="#059669"   onPress={() => navigation.navigate('CVBuilder')} />
          <QuickAction C={C} icon="star-outline"        label="Points"         color="#f59e0b"   onPress={() => navigation.navigate('Points')} />
          <QuickAction C={C} icon="bookmark-outline"    label="Saved"          color="#0891b2"   onPress={() => navigation.navigate('Saved')} />
          <QuickAction C={C} icon="list-outline"        label="Applications"   color="#7c3aed"   onPress={() => navigation.navigate('Applications', { filter: 'all' })} />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ C, label, value, icon, color, onPress }: { C: any; label: string; value: number; icon: any; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        flex: 1, minWidth: '45%',
        backgroundColor: C.card,
        borderRadius: Radius.md, padding: Spacing.md,
        alignItems: 'center', gap: 4,
        borderTopWidth: 3, borderTopColor: color,
        borderWidth: 1, borderColor: C.border,
        ...Shadow.sm,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ fontSize: FontSize['2xl'], fontWeight: '900', color: C.text }}>{value}</Text>
      <Text style={{ fontSize: FontSize.xs, color: C.textSecondary, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function AppRow({ app, C }: { app: Application; C: any }) {
  const status = app.status || 'pending';
  const sc = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const companyName = typeof app.company === 'object' ? (app.company?.name || '') : (app.company || '');
  const initial = (companyName || app.internship_title || '?').charAt(0).toUpperCase();
  const date = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderRadius: Radius.md,
      padding: Spacing.md, marginBottom: 8,
      borderWidth: 1, borderColor: C.border,
    }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
        <Text style={{ fontSize: FontSize.base, fontWeight: '800', color: C.primary }}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: C.text }} numberOfLines={1}>
          {app.internship_title || `Internship #${app.internship_id}`}
        </Text>
        {companyName ? (
          <Text style={{ fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 }} numberOfLines={1}>{companyName}</Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1, backgroundColor: sc.bg, borderColor: sc.border }}>
          <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: sc.text }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
        <Text style={{ fontSize: FontSize.xs, color: C.gray400 }}>{date}</Text>
      </View>
    </View>
  );
}

function QuickAction({ C, icon, label, color, onPress }: { C: any; icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={{ width: '47%', backgroundColor: C.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: C.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 24, paddingHorizontal: Spacing.lg,
  },
  greeting: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: FontSize['2xl'], fontWeight: '900', color: '#fff' },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  pointsText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: 10 },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: C.text },
  seeAll: { fontSize: FontSize.sm, fontWeight: '600' },
  emptyCard: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '700', color: C.text, marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: FontSize.sm, color: C.textSecondary, textAlign: 'center', marginBottom: 16 },
  browseBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
