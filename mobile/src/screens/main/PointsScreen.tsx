import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface PointsBalance { balance: number; total_earned: number; total_spent: number; }
interface Package { id: number; name: string; points: number; price: number; discount_percent: number; effective_price: number; description?: string; }
interface Transaction { id: number; amount: number; balance_after: number; transaction_type: string; service_name?: string; description?: string; created_at: string; }
interface ServicePrice { id: number; service_key: string; display_name: string; points_cost: number; first_time_free: boolean; description?: string; }

const PKG_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
const PKG_ICONS: any[] = ['gift-outline', 'flash-outline', 'star-outline', 'trophy-outline'];

const TXN_SOURCE: Record<string, { label: string; tag: string; icon: any; bg: string; color: string }> = {
  signup_bonus:       { label: 'Sign-Up Bonus',       tag: 'Bonus',    icon: 'gift-outline',         bg: '#d1fae5', color: '#065f46' },
  purchase:           { label: 'Points Purchase',      tag: 'Purchase', icon: 'bag-outline',          bg: '#dbeafe', color: '#1d4ed8' },
  service_charge:     { label: 'Service Used',         tag: 'Spent',    icon: 'settings-outline',     bg: '#ffedd5', color: '#c2410c' },
  admin_grant:        { label: 'Admin Grant',          tag: 'Granted',  icon: 'medal-outline',        bg: '#ede9fe', color: '#6d28d9' },
  refund:             { label: 'Refund',               tag: 'Refund',   icon: 'arrow-up-outline',     bg: '#f1f5f9', color: '#475569' },
  daily_login:        { label: 'Daily Login Reward',   tag: 'Login',    icon: 'log-in-outline',       bg: '#fef3c7', color: '#92400e' },
  streak_bonus:       { label: 'Login Streak Bonus',   tag: 'Streak',   icon: 'flame-outline',        bg: '#fee2e2', color: '#991b1b' },
  application_reward: { label: 'Application Reward',   tag: 'Applied',  icon: 'document-text-outline',bg: '#cffafe', color: '#155e75' },
  profile_completion: { label: 'Profile Completed',    tag: 'Profile',  icon: 'checkmark-circle-outline', bg: '#e0e7ff', color: '#3730a3' },
};
const DEFAULT_TXN = { label: 'Transaction', tag: 'Activity', icon: 'swap-horizontal-outline', bg: '#f1f5f9', color: '#475569' };

type Tab = 'store' | 'earn' | 'history' | 'pricing' | 'purchases';

export default function PointsScreen() {
  const navigation = useNavigation<NavProp>();
  const { C } = useTheme();
  const S = makeStyles(C);

  const [balance, setBalance] = useState<PointsBalance>({ balance: 0, total_earned: 0, total_spent: 0 });
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [activities, setActivities] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [tab, setTab] = useState<Tab>('store');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [balR, storeR, txnR, pricingR, earnR, purchR] = await Promise.allSettled([
        api.points.getBalance(),
        api.points.getStore(),
        api.points.getTransactions(),
        api.points.getPricing(),
        api.points.getEarningActivities().catch(() => ({ activities: null })),
        api.points.getMyPurchases().catch(() => ({ requests: [] })),
      ]);
      if (balR.status === 'fulfilled') setBalance((balR.value as any) || { balance: 0, total_earned: 0, total_spent: 0 });
      if (storeR.status === 'fulfilled') setPackages((storeR.value as any).packages || []);
      if (txnR.status === 'fulfilled') setTransactions(((txnR.value as any).transactions || []) as Transaction[]);
      if (pricingR.status === 'fulfilled') setServices(((pricingR.value as any).services || []) as ServicePrice[]);
      if (earnR.status === 'fulfilled') setActivities((earnR.value as any).activities || null);
      if (purchR.status === 'fulfilled') setPurchases((purchR.value as any).requests || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePurchase = async (pkgId: number) => {
    setPurchasing(pkgId);
    setSuccessMsg(null);
    try {
      const res = await api.points.purchase(pkgId);
      setSuccessMsg(res.message || 'Purchase request submitted! Awaiting admin approval.');
      const purchR = await api.points.getMyPurchases().catch(() => ({ requests: [] }));
      setPurchases((purchR as any).requests || []);
    } catch (err: any) {
      Alert.alert('Purchase Failed', err?.message || 'Could not process purchase.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    setSuccessMsg(null);
    try {
      const res = await api.points.claimDaily();
      if (res.already_claimed) {
        setSuccessMsg('Already claimed today! Come back tomorrow.');
      } else {
        const info = res.daily_reward;
        let msg = `+${info?.daily_reward ?? 5} daily login points!`;
        if (info?.streak_bonus > 0) msg += ` +${info.streak_bonus} streak bonus!`;
        setSuccessMsg(msg);
        setBalance(prev => ({ ...prev, balance: res.new_balance ?? prev.balance }));
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to claim daily reward.');
    } finally {
      setClaiming(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'store',     label: 'Buy Points',     icon: 'bag-outline' },
    { id: 'purchases', label: 'My Purchases',   icon: 'time-outline' },
    { id: 'earn',      label: 'Earn Points',    icon: 'trending-up-outline' },
    { id: 'pricing',   label: 'Service Costs',  icon: 'pricetag-outline' },
    { id: 'history',   label: 'History',        icon: 'receipt-outline' },
  ];

  if (loading) {
    return (
      <View style={[S.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={S.headerTitle}>Points Store</Text>
          <Text style={S.headerSub}>Purchase points to unlock premium features</Text>
        </View>
        {/* Balance badge */}
        <View style={S.balanceBadge}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={S.balanceBadgeText}>{balance.balance} pts</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} colors={[C.primary]} />}
      >
        {/* Stats row */}
        <View style={S.statsRow}>
          <View style={[S.statCard, { flex: 1, marginRight: 8 }]}>
            <Text style={S.statLabel}>Total Earned</Text>
            <Text style={[S.statValue, { color: '#16a34a' }]}>+{balance.total_earned}</Text>
          </View>
          <View style={[S.statCard, { flex: 1, marginLeft: 8 }]}>
            <Text style={S.statLabel}>Total Spent</Text>
            <Text style={[S.statValue, { color: '#dc2626' }]}>-{balance.total_spent}</Text>
          </View>
        </View>

        {/* Success message */}
        {successMsg && (
          <View style={S.successMsg}>
            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            <Text style={S.successMsgText}>{successMsg}</Text>
          </View>
        )}

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.tabScroll} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[S.tabBtn, tab === t.id && S.tabBtnActive]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={t.icon} size={15} color={tab === t.id ? '#fff' : C.textSecondary} />
              <Text style={[S.tabText, tab === t.id && S.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── STORE (Buy Points) ─────────────────────────────── */}
        {tab === 'store' && (
          <View style={S.section}>
            {packages.length === 0 ? (
              <EmptyState icon="bag-outline" title="No packages available" sub="Check back later for points packages." C={C} />
            ) : (
              packages.map((pkg, idx) => {
                const color = PKG_COLORS[idx % PKG_COLORS.length];
                const icon = PKG_ICONS[idx % PKG_ICONS.length];
                return (
                  <View key={pkg.id} style={[S.pkgCard, { borderColor: C.cardBorder }]}>
                    {/* Colored banner */}
                    <View style={[S.pkgBanner, { backgroundColor: color }]}>
                      <Ionicons name={icon} size={28} color="#fff" />
                      <Text style={S.pkgName}>{pkg.name}</Text>
                      <Text style={S.pkgPoints}>{pkg.points} <Text style={{ fontSize: FontSize.base, fontWeight: '400', opacity: 0.8 }}>pts</Text></Text>
                    </View>
                    <View style={S.pkgBody}>
                      {pkg.description && <Text style={S.pkgDesc}>{pkg.description}</Text>}
                      <View style={S.pkgPriceRow}>
                        {pkg.discount_percent > 0 ? (
                          <View>
                            <Text style={S.pkgStrike}>${pkg.price.toFixed(2)}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={S.pkgPrice}>${pkg.effective_price.toFixed(2)}</Text>
                              <View style={S.discountBadge}>
                                <Text style={S.discountText}>-{pkg.discount_percent}%</Text>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <Text style={S.pkgPrice}>${pkg.price.toFixed(2)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[S.buyBtn, { backgroundColor: color }, purchasing === pkg.id && S.btnDisabled]}
                        onPress={() => handlePurchase(pkg.id)}
                        disabled={purchasing === pkg.id}
                        activeOpacity={0.85}
                      >
                        {purchasing === pkg.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <><Ionicons name="bag-outline" size={16} color="#fff" /><Text style={S.buyBtnText}> Buy Now</Text></>
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── MY PURCHASES ─────────────────────────────────────── */}
        {tab === 'purchases' && (
          <View style={S.section}>
            <View style={S.listCard}>
              <View style={S.listHeader}>
                <Text style={S.listTitle}>My Purchase Requests</Text>
                <Text style={S.listSub}>Points are credited once admin approves.</Text>
              </View>
              {purchases.length === 0 ? (
                <EmptyState icon="bag-outline" title="No purchase requests yet" sub="Buy a package from the store to get started." C={C} />
              ) : (
                purchases.map(req => (
                  <View key={req.id} style={S.purchaseRow}>
                    <View style={[S.purchaseIcon, {
                      backgroundColor: req.status === 'pending' ? '#fef3c7' : req.status === 'approved' ? '#d1fae5' : '#fee2e2'
                    }]}>
                      <Ionicons
                        name={req.status === 'pending' ? 'time-outline' : req.status === 'approved' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                        size={20}
                        color={req.status === 'pending' ? '#92400e' : req.status === 'approved' ? '#065f46' : '#991b1b'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.purchaseName}>{req.package_name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <View style={[S.statusBadge, {
                          backgroundColor: req.status === 'pending' ? '#fef3c7' : req.status === 'approved' ? '#d1fae5' : '#fee2e2'
                        }]}>
                          <Text style={[S.statusText, { color: req.status === 'pending' ? '#92400e' : req.status === 'approved' ? '#065f46' : '#991b1b' }]}>
                            {req.status}
                          </Text>
                        </View>
                        <Text style={S.purchaseDate}>{new Date(req.created_at).toLocaleDateString()}</Text>
                      </View>
                      {req.status === 'pending' && <Text style={S.pendingNote}>Awaiting admin approval</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={S.purchasePts}>{req.points} pts</Text>
                      <Text style={S.purchasePrice}>${req.price}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ── EARN POINTS ──────────────────────────────────────── */}
        {tab === 'earn' && (
          <View style={S.section}>
            {/* Daily login claim */}
            <View style={S.listCard}>
              <View style={S.earnRow}>
                <View style={[S.earnIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="flame-outline" size={22} color="#92400e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.earnTitle}>{activities?.daily_login?.name || 'Daily Login'}</Text>
                  <Text style={S.earnSub}>{activities?.daily_login?.description || 'Log in every day to earn points'}</Text>
                  {activities?.daily_login?.streak !== undefined && (
                    <Text style={{ fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 }}>
                      🔥 {activities.daily_login.streak}-day streak
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[S.claimBtn, activities?.daily_login?.claimed_today && S.btnDisabled]}
                  onPress={handleClaimDaily}
                  disabled={claiming || activities?.daily_login?.claimed_today}
                  activeOpacity={0.85}
                >
                  {claiming
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={S.claimBtnText}>{activities?.daily_login?.claimed_today ? '✓ Claimed' : `Claim +${activities?.daily_login?.points ?? 5} pts`}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Other earning tips */}
            {[
              { icon: 'document-text-outline', color: '#cffafe', ic: '#155e75', title: 'Apply to Internships', desc: '+10 pts per application' },
              { icon: 'person-outline', color: '#e0e7ff', ic: '#3730a3', title: 'Complete Your Profile', desc: '+points per field filled' },
              { icon: 'log-in-outline', color: '#fef3c7', ic: '#92400e', title: 'Daily Login Streak', desc: 'Bonus points for consecutive logins' },
            ].map(item => (
              <View key={item.title} style={[S.listCard, { marginTop: Spacing.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={[S.earnIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.ic} />
                </View>
                <View>
                  <Text style={S.earnTitle}>{item.title}</Text>
                  <Text style={S.earnSub}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── SERVICE COSTS ─────────────────────────────────────── */}
        {tab === 'pricing' && (
          <View style={S.section}>
            <View style={S.listCard}>
              <View style={S.listHeader}>
                <Text style={S.listTitle}>Service Point Costs</Text>
                <Text style={S.listSub}>How many points each service costs</Text>
              </View>
              {services.length === 0 ? (
                <EmptyState icon="pricetag-outline" title="No pricing configured" sub="" C={C} />
              ) : (
                services.map(svc => (
                  <View key={svc.id} style={S.svcRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.svcName}>{svc.display_name}</Text>
                      {svc.description && <Text style={S.svcDesc}>{svc.description}</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {svc.first_time_free && (
                        <View style={S.freeBadge}><Text style={S.freeText}>1st free</Text></View>
                      )}
                      <Text style={S.svcCost}>{svc.points_cost} <Text style={{ fontSize: FontSize.xs, fontWeight: '400', color: C.textSecondary }}>pts</Text></Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ── HISTORY ──────────────────────────────────────────── */}
        {tab === 'history' && (
          <View style={S.section}>
            <View style={S.listCard}>
              <View style={S.listHeader}>
                <Text style={S.listTitle}>Points Activity Log</Text>
                <Text style={S.listSub}>Every point earned and spent</Text>
              </View>
              {transactions.length === 0 ? (
                <EmptyState icon="receipt-outline" title="No transactions yet" sub="Your points activity will appear here." C={C} />
              ) : (
                transactions.map(txn => {
                  const src = TXN_SOURCE[txn.transaction_type] || DEFAULT_TXN;
                  const isPos = txn.amount >= 0;
                  return (
                    <View key={txn.id} style={S.txnRow}>
                      <View style={[S.txnIcon, { backgroundColor: src.bg }]}>
                        <Ionicons name={src.icon} size={18} color={src.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={S.txnLabel}>{src.label}</Text>
                          <View style={[S.txnTag, { backgroundColor: src.bg }]}>
                            <Text style={[S.txnTagText, { color: src.color }]}>{src.tag}</Text>
                          </View>
                        </View>
                        {txn.description && <Text style={S.txnDesc} numberOfLines={1}>{txn.description}</Text>}
                        <Text style={S.txnDate}>{new Date(txn.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[S.txnAmount, { color: isPos ? '#16a34a' : '#dc2626' }]}>
                          {isPos ? '+' : ''}{txn.amount} pts
                        </Text>
                        <Text style={S.txnBalance}>Bal: {txn.balance_after}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, title, sub, C }: { icon: any; title: string; sub: string; C: any }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
      <Ionicons name={icon} size={48} color={C.gray300} />
      <Text style={{ fontSize: FontSize.base, fontWeight: '700', color: C.text, marginTop: 16 }}>{title}</Text>
      {sub ? <Text style={{ fontSize: FontSize.sm, color: C.textSecondary, textAlign: 'center', marginTop: 6 }}>{sub}</Text> : null}
    </View>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1e40af', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full,
  },
  balanceBadgeText: { fontSize: FontSize.sm, fontWeight: '800', color: '#fff' },

  statsRow: { flexDirection: 'row', margin: Spacing.md, marginBottom: 0 },
  statCard: {
    backgroundColor: C.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: C.border, ...Shadow.sm,
  },
  statLabel: { fontSize: FontSize.xs, color: C.textSecondary, marginBottom: 4 },
  statValue: { fontSize: FontSize['2xl'], fontWeight: '800', color: C.text },

  successMsg: {
    flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing.md, marginBottom: 0,
    backgroundColor: '#d1fae5', borderRadius: Radius.md, padding: 12,
    borderWidth: 1, borderColor: '#a7f3d0',
  },
  successMsgText: { flex: 1, fontSize: FontSize.sm, color: '#065f46', fontWeight: '600' },

  tabScroll: { marginTop: Spacing.md, marginBottom: 4 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: FontSize.xs, fontWeight: '700', color: C.textSecondary },
  tabTextActive: { color: '#fff' },

  section: { padding: Spacing.md, paddingTop: 8 },

  // Packages
  pkgCard: {
    backgroundColor: C.card, borderRadius: Radius.xl, overflow: 'hidden',
    marginBottom: Spacing.md, borderWidth: 2, borderColor: C.border, ...Shadow.sm,
  },
  pkgBanner: { padding: Spacing.lg, alignItems: 'center', gap: 6 },
  pkgName: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
  pkgPoints: { fontSize: FontSize['2xl'] + 8, fontWeight: '900', color: '#fff', lineHeight: 42 },
  pkgBody: { padding: Spacing.md },
  pkgDesc: { fontSize: FontSize.sm, color: C.textSecondary, marginBottom: 12 },
  pkgPriceRow: { marginBottom: 12 },
  pkgStrike: { fontSize: FontSize.sm, color: C.textMuted, textDecorationLine: 'line-through' },
  pkgPrice: { fontSize: FontSize.xl, fontWeight: '800', color: C.text },
  discountBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  discountText: { fontSize: FontSize.xs, color: '#991b1b', fontWeight: '700' },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: Radius.md, gap: 6,
  },
  buyBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },

  // List card container
  listCard: {
    backgroundColor: C.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...Shadow.sm,
  },
  listHeader: {
    padding: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  listTitle: { fontSize: FontSize.lg, fontWeight: '800', color: C.text },
  listSub: { fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 },

  // Purchases
  purchaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  purchaseIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  purchaseName: { fontSize: FontSize.base, fontWeight: '700', color: C.text },
  purchaseDate: { fontSize: FontSize.xs, color: C.textSecondary },
  pendingNote: { fontSize: FontSize.xs, color: '#92400e', marginTop: 2 },
  purchasePts: { fontSize: FontSize.base, fontWeight: '800', color: '#f59e0b' },
  purchasePrice: { fontSize: FontSize.xs, color: C.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'capitalize' },

  // Earn
  earnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md,
  },
  earnIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  earnTitle: { fontSize: FontSize.base, fontWeight: '700', color: C.text },
  earnSub: { fontSize: FontSize.xs, color: C.textSecondary },
  claimBtn: {
    backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.md, minWidth: 90, alignItems: 'center',
  },
  claimBtnText: { fontSize: FontSize.xs, fontWeight: '800', color: '#fff' },

  // Service pricing
  svcRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  svcName: { fontSize: FontSize.base, fontWeight: '700', color: C.text },
  svcDesc: { fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 },
  svcCost: { fontSize: FontSize.base, fontWeight: '800', color: C.text },
  freeBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  freeText: { fontSize: FontSize.xs, color: '#065f46', fontWeight: '700' },

  // History
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  txnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txnLabel: { fontSize: FontSize.sm, fontWeight: '700', color: C.text },
  txnTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  txnTagText: { fontSize: 10, fontWeight: '700' },
  txnDesc: { fontSize: FontSize.xs, color: C.textSecondary, marginTop: 1 },
  txnDate: { fontSize: FontSize.xs, color: C.textMuted, marginTop: 2 },
  txnAmount: { fontSize: FontSize.base, fontWeight: '800' },
  txnBalance: { fontSize: FontSize.xs, color: C.textMuted },
});
