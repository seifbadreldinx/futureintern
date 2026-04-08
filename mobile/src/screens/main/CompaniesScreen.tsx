import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../services/api';
import { Company } from '../../types';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';

const INITIAL_COLORS = ['#f43f5e', '#2563eb', '#059669', '#7c3aed', '#f59e0b', '#0891b2'];
const colorFor = (name: string) => INITIAL_COLORS[name.charCodeAt(0) % INITIAL_COLORS.length];

const API_BASE = 'https://futureintern-production.up.railway.app';
const FRONTEND_BASE = 'https://futureintern-two.vercel.app';

const resolveLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const match = url.match(/\/uploads\/logos\/(.+)$/);
    if (match) return `${API_BASE}/uploads/logos/${match[1]}`;
    return url;
  }
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  if (url.startsWith('/logos/')) return `${FRONTEND_BASE}${url}`;
  return null;
};

// ─── Company card (separate component so it can use useState for img error) ───

function CompanyCard({ item, styles, C }: { item: Company; styles: any; C: any }) {
  const logoColor = colorFor(item.name);
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=eff6ff&color=2563eb&size=128&bold=true`;
  const [logoSrc, setLogoSrc] = useState<string>(item.logo_url || avatarUrl);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CompanyOpenings', { companyId: item.id, companyName: item.name })}
    >
      <View style={styles.cardHeader}>
        {/* Logo */}
        <View style={[styles.logoWrap, { borderColor: logoColor + '30' }]}>
          <Image
            source={{ uri: logoSrc }}
            style={styles.logo}
            resizeMode="contain"
            onError={() => setLogoSrc(avatarUrl)}
          />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
          {item.industry ? (
            <Text style={styles.industry} numberOfLines={1}>{item.industry}</Text>
          ) : null}
          {item.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color={C.textSecondary} />
              <Text style={styles.location}>{item.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Open roles badge */}
        {(item.internships_count ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.internships_count}</Text>
            <Text style={styles.badgeLabel}>open</Text>
          </View>
        )}
      </View>

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.viewOpenings}>
        <Text style={styles.viewOpeningsText}>View Openings</Text>
        <Ionicons name="arrow-forward" size={14} color={C.primary} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CompaniesScreen() {
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.companies.list();
      const list: Company[] = (res.companies || []).map((c: any) => ({
        id: c.id,
        name: c.company_name || c.name || 'Company',
        description: c.company_description || c.bio || c.description || '',
        logo_url: resolveLogoUrl(c.profile_image || c.logo_url || c.company_logo) ?? undefined,
        website: c.company_website || c.website || '',
        industry: c.industry || '',
        location: c.company_location || c.location || '',
        internships_count: c.internship_count ?? c.internships_count ?? 0,
      }));
      setCompanies(list);
      setFiltered(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(companies);
    } else {
      const q = search.toLowerCase();
      setFiltered(companies.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q)
      ));
    }
  }, [search, companies]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Companies</Text>
        <Text style={styles.headerSub}>
          {companies.length > 0 ? `${companies.length} companies hiring` : 'Explore companies'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search companies..."
            placeholderTextColor={C.textMuted}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <CompanyCard item={item} styles={styles} C={C} />}
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
              <Ionicons name="business-outline" size={48} color={C.gray300} />
              <Text style={styles.emptyText}>
                {search ? 'No companies match your search' : 'No companies found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  searchWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: C.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
    ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: C.text, padding: 0 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: C.border,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    backgroundColor: C.gray50,
  },
  logo: { width: '100%', height: '100%' },
  cardInfo: { flex: 1 },
  companyName: { fontSize: FontSize.base, fontWeight: '800', color: C.text, marginBottom: 2 },
  industry: { fontSize: FontSize.xs, color: C.primary, fontWeight: '600', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: FontSize.xs, color: C.textSecondary },
  badge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.primary + '15',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  badgeText: { fontSize: FontSize.md, fontWeight: '900', color: C.primary },
  badgeLabel: { fontSize: 9, color: C.primary, fontWeight: '600', textTransform: 'uppercase' },
  description: { fontSize: FontSize.sm, color: C.textSecondary, lineHeight: 18 },
  viewOpenings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, gap: 4 },
  viewOpeningsText: { fontSize: FontSize.xs, fontWeight: '700', color: C.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: FontSize.base, color: C.textSecondary, textAlign: 'center' },
});
