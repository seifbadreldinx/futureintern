import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'Applications'>;

const STATUSES = ['all', 'pending', 'reviewing', 'accepted', 'rejected'] as const;
type StatusFilter = typeof STATUSES[number];

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  pending:    { label: 'Pending',    bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: 'time-outline' },
  reviewing:  { label: 'Reviewing',  bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', icon: 'eye-outline' },
  accepted:   { label: 'Accepted',   bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', icon: 'checkmark-circle-outline' },
  rejected:   { label: 'Rejected',   bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: 'close-circle-outline' },
};

interface Application {
  id: number;
  internship_id: number;
  status: string;
  applied_at: string;
  internship_title?: string;
  company?: any;
  internship?: any;
}

export default function ApplicationsScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const initialFilter = (route.params?.filter as StatusFilter) || 'all';
  const [filter, setFilter] = useState<StatusFilter>(initialFilter);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.applications.list();
      setApplications(res.applications || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const getCompanyName = (app: Application) => {
    if (app.company && typeof app.company === 'object') return app.company.name || app.company.company_name || '';
    if (app.internship && typeof app.internship === 'object') {
      const co = app.internship.company;
      if (co && typeof co === 'object') return co.name || co.company_name || '';
    }
    return '';
  };

  const getTitle = (app: Application) =>
    app.internship_title ||
    (app.internship && app.internship.title) ||
    `Application #${app.id}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSub}>{applications.length} total</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <FlatList
          data={STATUSES as unknown as string[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={s => s}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}
          renderItem={({ item: s }) => {
            const isActive = filter === s;
            const count = s === 'all'
              ? applications.length
              : applications.filter(a => a.status === s).length;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(s as StatusFilter)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="briefcase-outline" size={48} color={C.gray300} />
              <Text style={styles.emptyText}>
                {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
              </Text>
            </View>
          }
          renderItem={({ item: app }) => {
            const statusMeta = STATUS_META[app.status] || STATUS_META.pending;
            const title = getTitle(app);
            const company = getCompanyName(app);
            const initial = (company || title).charAt(0).toUpperCase();
            const date = new Date(app.applied_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.appTitle} numberOfLines={2}>{title}</Text>
                    {company ? (
                      <Text style={styles.appCompany} numberOfLines={1}>{company}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
                    <Ionicons name={statusMeta.icon} size={12} color={statusMeta.text} />
                    <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Ionicons name="calendar-outline" size={12} color={C.gray400} />
                  <Text style={styles.dateText}>Applied {date}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  filterRow: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: '600', color: C.textSecondary },
  filterTextActive: { color: '#fff' },
  filterBadge: {
    backgroundColor: C.border, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: C.textSecondary },
  filterBadgeTextActive: { color: '#fff' },
  list: { padding: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: C.border,
    ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: C.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '800', color: C.primary },
  cardInfo: { flex: 1 },
  appTitle: { fontSize: FontSize.base, fontWeight: '700', color: C.text, marginBottom: 2 },
  appCompany: { fontSize: FontSize.sm, color: C.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: FontSize.xs, color: C.gray400 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, fontSize: FontSize.base, color: C.textSecondary, textAlign: 'center' },
});
