import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:    { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  reviewing:  { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  accepted:   { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  rejected:   { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  shortlisted:{ bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe' },
};

interface Application {
  id: number;
  internship_id: number;
  status: string;
  applied_at: string;
  internship_title?: string;
  company?: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [points, setPoints] = useState<number>(0);
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

  const recentApps = applications.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={Colors.primary} />}
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

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Total" value={stats.total} icon="briefcase-outline" color={Colors.primary} />
        <StatCard label="Pending" value={stats.pending} icon="time-outline" color="#f59e0b" />
        <StatCard label="Reviewing" value={stats.reviewing} icon="eye-outline" color="#3b82f6" />
        <StatCard label="Accepted" value={stats.accepted} icon="checkmark-circle-outline" color="#10b981" />
      </View>

      {/* Recent Applications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          {applications.length > 5 && (
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentApps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="briefcase-outline" size={32} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptySubtitle}>Start applying to internships to track them here</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Main' as any)}>
              <Text style={styles.browseBtnText}>Browse Internships</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentApps.map(app => (
            <ApplicationRow key={app.id} app={app} />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="briefcase-outline"
            label="Browse Jobs"
            color={Colors.primary}
            onPress={() => navigation.navigate('Main' as any)}
          />
          <QuickAction
            icon="document-text-outline"
            label="My CV"
            color="#7c3aed"
            onPress={() => {}}
          />
          <QuickAction
            icon="bookmark-outline"
            label="Saved"
            color="#0891b2"
            onPress={() => {}}
          />
          <QuickAction
            icon="star-outline"
            label="Points"
            color="#f59e0b"
            onPress={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  const status = app.status || 'pending';
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const date = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={appStyles.row}>
      <View style={appStyles.iconBox}>
        <Text style={appStyles.initial}>
          {(app.company || app.internship_title || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={appStyles.info}>
        <Text style={appStyles.title} numberOfLines={1}>{app.internship_title || `Internship #${app.internship_id}`}</Text>
        <Text style={appStyles.company} numberOfLines={1}>{app.company || ''}</Text>
      </View>
      <View style={appStyles.right}>
        <View style={[appStyles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[appStyles.statusText, { color: colors.text }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
        <Text style={appStyles.date}>{date}</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={qaStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[qaStyles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={qaStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 24, paddingHorizontal: Spacing.lg,
  },
  greeting: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  pointsText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: Spacing.md, gap: 10,
  },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  emptyCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  browseBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },
  browseBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', gap: 4,
    borderTopWidth: 3, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  value: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.text },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
});

const appStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  initial: { fontSize: FontSize.base, fontWeight: '800', color: Colors.primary },
  info: { flex: 1 },
  title: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  company: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  date: { fontSize: FontSize.xs, color: Colors.gray400 },
});

const qaStyles = StyleSheet.create({
  card: {
    width: '47%', backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
});
