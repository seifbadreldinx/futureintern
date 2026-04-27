import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
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

  // AI Recommendations
  const REC_KEY = `rec_${user?.id}`;
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  // Restore cached recommendations on mount
  useEffect(() => {
    AsyncStorage.getItem(REC_KEY).then(val => {
      if (val) {
        try {
          const cached = JSON.parse(val);
          if (Array.isArray(cached) && cached.length > 0) {
            setRecommendedInternships(cached);
            setRecommendationsLoaded(true);
          }
        } catch {}
      }
    });
  }, [REC_KEY]);

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

  // When the screen comes back into focus (e.g. after editing profile),
  // reset a "profile incomplete" error so the user can retry without extra taps.
  useFocusEffect(
    useCallback(() => {
      setRecommendError(prev => {
        if (prev?.toLowerCase().includes('complete your profile')) {
          setRecommendationsLoaded(false);
          return null;
        }
        return prev;
      });
    }, []) // empty deps — only fires on actual screen focus, not on state change
  );

  const loadRecommendations = async (force = false) => {
    if (!force && (recommendationsLoaded || isLoadingRecommendations)) return;
    setIsLoadingRecommendations(true);
    setRecommendError(null);
    try {
      const recommended = await api.internships.listRecommendations();
      const recs = Array.isArray(recommended) ? recommended : [];
      setRecommendedInternships(recs);
      setRecommendationsLoaded(true);
      AsyncStorage.setItem(REC_KEY, JSON.stringify(recs)).catch(() => {});
      const balRes = await api.points.balance().catch(() => ({ balance: 0 }));
      setPoints((balRes as any).balance ?? 0);
    } catch (err: any) {
      setRecommendedInternships([]);
      setRecommendError(err?.message || 'Could not load recommendations. Please try again.');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  /** Clear cache and re-fetch (explicit user action) */
  const refreshRecommendations = () => {
    AsyncStorage.removeItem(REC_KEY).catch(() => {});
    setRecommendationsLoaded(false);
    setRecommendedInternships([]);
    loadRecommendations(true);
  };

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

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: Spacing.lg }}>
          <TouchableOpacity
            style={[S.cvCardSmall, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => navigation.navigate('CVBuilder')}
            activeOpacity={0.85}
          >
            <View style={S.cvIconSmall}>
              <Ionicons name="document-text" size={20} color="#f43f5e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cvTitleSmall, { color: C.text }]}>CV Builder</Text>
              <Text style={[S.cvSubSmall, { color: C.textSecondary }]}>Edit & Build ATS</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.cvCardSmall, { backgroundColor: C.primary, borderColor: C.primary }]}
            onPress={() => navigation.navigate('CVBuilder')}
            activeOpacity={0.85}
          >
            <View style={[S.cvIconSmall, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="eye" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cvTitleSmall, { color: '#fff' }]}>CV Preview</Text>
              <Text style={[S.cvSubSmall, { color: 'rgba(255,255,255,0.8)' }]}>Preview & Download</Text>
            </View>
          </TouchableOpacity>
        </View>

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

        {/* ── AI Recommendations ── */}
        <View style={[S.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[S.sectionTitle, { color: C.text, marginBottom: 0 }]}>AI RECOMMENDATIONS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {recommendationsLoaded && !isLoadingRecommendations && (
                <TouchableOpacity
                  onPress={refreshRecommendations}
                  style={{ backgroundColor: C.card, borderWidth: 2, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 12 }}>↻ New</Text>
                </TouchableOpacity>
              )}
              <Ionicons name="sparkles" size={18} color="#3b82f6" />
            </View>
          </View>

          {!recommendationsLoaded && !isLoadingRecommendations && !recommendError ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="sparkles-outline" size={48} color="#93c5fd" />
              <Text style={{ color: C.textSecondary, marginTop: 8, marginBottom: 16, textAlign: 'center', fontSize: 13 }}>
                AI recommendations cost 10 points per request.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                onPress={loadRecommendations}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Get AI Recommendations</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingRecommendations ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={{ color: C.textSecondary, marginTop: 12, fontWeight: '600', textAlign: 'center' }}>
                Finding your best matches…
              </Text>
              <Text style={{ color: C.gray400, marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                This may take up to 60 seconds on the first request while the AI model loads.
              </Text>
            </View>
          ) : recommendError ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="sparkles-outline" size={48} color={C.gray400} />
              {recommendError.toLowerCase().includes('complete your profile') ? (
                <>
                  <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginTop: 12 }}>Profile Incomplete</Text>
                  <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 16, fontSize: 13 }}>{recommendError}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
                      onPress={() => navigation.navigate('Main', { screen: 'Profile' } as any)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Complete Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: C.card, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#2563eb' }}
                      onPress={() => { setRecommendError(null); setRecommendationsLoaded(false); }}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: '#2563eb', fontWeight: '800', fontSize: 14 }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : recommendError.toLowerCase().includes('insufficient points') ? (
                <>
                  <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginTop: 12 }}>Not Enough Points</Text>
                  <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 16, fontSize: 13 }}>
                    You need 10 points to get AI recommendations. Earn points by completing your profile, applying to internships, and daily logins.
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    onPress={() => navigation.navigate('Points')}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Earn Points</Text>
                  </TouchableOpacity>
                </>
              ) : recommendError?.toLowerCase().includes('still being processed') ? (
                <>
                  <Ionicons name="time-outline" size={48} color="#f59e0b" />
                  <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginTop: 12 }}>Still Processing…</Text>
                  <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 16, fontSize: 13 }}>{recommendError}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    onPress={() => { setRecommendError(null); refreshRecommendations(); }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Check Result</Text>
                  </TouchableOpacity>
                </>
              ) : recommendError?.toLowerCase().includes('refunded') ? (
                <>
                  <Ionicons name="refresh-circle-outline" size={48} color="#22c55e" />
                  <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginTop: 12 }}>Matching Failed — Points Refunded</Text>
                  <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 16, fontSize: 13 }}>{recommendError}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    onPress={() => { setRecommendError(null); refreshRecommendations(); }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Try Again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 12, marginBottom: 16, fontSize: 13 }}>{recommendError}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    onPress={() => { setRecommendError(null); refreshRecommendations(); }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Try Again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : recommendedInternships.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="sparkles-outline" size={48} color={C.gray400} />
              <Text style={{ color: C.textSecondary, marginTop: 8, textAlign: 'center', fontSize: 13 }}>
                No specific recommendations yet. Try updating your profile or uploading a CV!
              </Text>
            </View>
          ) : (
            recommendedInternships.map((rec: any, index: number) => (
              <RecCard key={rec.internship?.id} rec={rec} rank={index + 1} C={C} onPress={() => navigation.navigate('InternshipDetail', { id: rec.internship?.id })} />
            ))
          )}
        </View>

        {/* ── Top AI Picks ── */}
        <View style={[S.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={16} color="#3b82f6" />
              <Text style={[S.sectionTitle, { color: C.text, marginBottom: 0 }]}>TOP AI PICKS</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Dashboard' } as any)}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>See all →</Text>
            </TouchableOpacity>
          </View>

          {!recommendationsLoaded && !isLoadingRecommendations ? (
            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 10 }}>
              <Ionicons name="sparkles-outline" size={36} color="#93c5fd" />
              <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: 'center' }}>AI recommendations cost 10 points per request.</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                onPress={loadRecommendations}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Get AI Recommendations</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingRecommendations ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={{ color: C.textSecondary, fontSize: 13, fontWeight: '600' }}>Finding your best matches…</Text>
            </View>
          ) : recommendedInternships.length === 0 ? (
            <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
              No recommendations yet. Complete your profile to get started.
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {recommendedInternships.slice(0, 3).map((rec: any, index: number) => {
                const ovRankBg     = index === 0 ? '#F59E0B' : index === 1 ? '#94A3B8' : '#B45309';
                const ovRankBorder = index === 0 ? '#D97706' : index === 1 ? '#64748B' : '#78350F';
                const ovRankText   = index === 0 ? '#7C2D12' : index === 1 ? '#0F172A' : '#FFF7ED';
                const ovRankLabel  = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                const internship = rec.internship || {};
                const company = internship.company || {};
                return (
                  <TouchableOpacity
                    key={internship.id}
                    style={[S.topPickRow, { borderColor: C.border, backgroundColor: C.background }]}
                    onPress={() => navigation.navigate('InternshipDetail', { id: internship.id })}
                    activeOpacity={0.85}
                  >
                    <View style={[S.rankBadge, { backgroundColor: ovRankBg, borderColor: ovRankBorder, borderWidth: 2 }]}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: ovRankText }}>{ovRankLabel}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: C.text, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>{internship.title || 'Internship'}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                        {company.name}{internship.location ? ` · ${internship.location}` : ''}
                      </Text>
                    </View>
                    <View style={S.matchBadge}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#065f46' }}>{Math.round(rec.score ?? 0)}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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

function RecCard({ rec, rank, C, onPress }: { rec: any; rank: number; C: any; onPress: () => void }) {
  const internship = rec.internship || {};
  const company = internship.company || {};
  const companyName = company.name || '';
  const logoUrl = resolveLogoUrl(company.profile_image);
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'C')}&background=eff6ff&color=2563eb&size=128&bold=true`;
  const [imgSrc, setImgSrc] = useState<string>(logoUrl || avatarUrl);

  const explanation = rec.match_details?.explanation;
  const sbert = rec.match_details?.sbert_score ?? 0;
  const tfidf = rec.match_details?.tfidf_score ?? 0;

  const rankBg    = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : rank === 3 ? '#B45309' : C.card;
  const rankBorder = rank === 1 ? '#D97706' : rank === 2 ? '#64748B' : rank === 3 ? '#78350F' : C.border;
  const rankText   = rank === 1 ? '#7C2D12' : rank === 2 ? '#0F172A' : rank === 3 ? '#FFF7ED' : C.textSecondary;
  const rankLabel  = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <TouchableOpacity
      style={[S.recCard, { borderColor: C.border, backgroundColor: C.background }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* ── Header row ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* Rank badge */}
        <View style={[S.rankBadge, { backgroundColor: rankBg, borderColor: rankBorder, borderWidth: 2 }]}>
          <Text style={{ fontSize: rank <= 3 ? 14 : 11, fontWeight: '900', color: rankText }}>{rankLabel}</Text>
        </View>
        <Image
          source={{ uri: imgSrc }}
          style={S.recLogo}
          resizeMode="contain"
          onError={() => setImgSrc(avatarUrl)}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
            {internship.title || 'Internship'}
          </Text>
          {companyName ? (
            <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {companyName}
            </Text>
          ) : null}
        </View>
        <View style={S.matchBadge}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#065f46' }}>
            {Math.round(rec.score ?? 0)}% Match
          </Text>
        </View>
      </View>

      {/* ── Location ── */}
      {internship.location ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
          <Ionicons name="location-outline" size={12} color={C.textSecondary} />
          <Text style={{ color: C.textSecondary, fontSize: 12 }}>{internship.location}</Text>
        </View>
      ) : null}

      {/* ── XAI Explanation ── */}
      {explanation ? (
        <View style={[S.xaiBox, { borderColor: C.border }]}>
          <Text style={{ fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 0.8, marginBottom: 6 }}>
            WHY WE RECOMMEND THIS
          </Text>

          {/* Matched skill tags */}
          {explanation.matched_skills?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {explanation.matched_skills.map((skill: string) => (
                <View key={skill} style={S.skillTag}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534' }}>✓ {skill}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Human-readable reasons */}
          {explanation.reasons?.length > 0 && (
            <View style={{ gap: 3, marginBottom: 8 }}>
              {explanation.reasons.map((reason: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#3b82f6', marginTop: 4 }} />
                  <Text style={{ fontSize: 11, color: C.textSecondary, flex: 1, lineHeight: 16 }}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Score bars */}
          <View style={{ gap: 5, marginBottom: 6 }}>
            <ScoreBar label="Semantic 70%" value={sbert} color="#3b82f6" C={C} />
            <ScoreBar label="Keyword  30%" value={tfidf} color="#64748b" C={C} />
          </View>

          {/* Extra badges */}
          {(explanation.major_match || explanation.matched_interests?.length > 0) && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {explanation.major_match && (
                <View style={[S.xaiBadge, { backgroundColor: '#7c3aed' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>Major Match</Text>
                </View>
              )}
              {explanation.matched_interests?.length > 0 && (
                <View style={[S.xaiBadge, { backgroundColor: '#d97706' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>Interest Fit</Text>
                </View>
              )}
            </View>
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function ScoreBar({ label, value, color, C }: { label: string; value: number; color: string; C: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: C.textSecondary, width: 72 }}>{label}</Text>
      <View style={{ flex: 1, height: 6, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
      </View>
      <Text style={{ fontSize: 9, fontWeight: '900', color, width: 34, textAlign: 'right' }}>
        {value.toFixed(1)}%
      </Text>
    </View>
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
  cvCardSmall: {
    flex: 1, borderRadius: Radius.lg, borderWidth: 1,
    padding: 12, alignItems: 'flex-start',
    ...Shadow.sm, gap: 8,
  },
  cvIconSmall: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  cvTitleSmall: { fontSize: FontSize.sm, fontWeight: '800', marginBottom: 2 },
  cvSubSmall: { fontSize: FontSize.xs, lineHeight: 14 },

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

  // Rec cards
  recCard: {
    borderWidth: 1.5, borderRadius: Radius.md,
    padding: 12, marginBottom: 10,
  },
  topPickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: Radius.md,
    padding: 10,
  },
  recLogo: { width: 40, height: 40, borderRadius: 8 },
  rankBadge: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  matchBadge: {
    backgroundColor: '#d1fae5', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },

  // XAI explanation panel
  xaiBox: {
    borderTopWidth: 1, paddingTop: 10, marginTop: 2,
  },
  skillTag: {
    backgroundColor: '#dcfce7', borderRadius: 6, borderWidth: 1, borderColor: '#86efac',
    paddingHorizontal: 7, paddingVertical: 3,
  },
  xaiBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
});
