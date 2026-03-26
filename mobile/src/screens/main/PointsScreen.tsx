import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Transaction {
  id: number;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface StoreItem {
  id: number;
  name: string;
  description: string;
  cost: number;
  category: string;
}

const TXN_ICONS: Record<string, { icon: any; color: string }> = {
  earned:  { icon: 'add-circle-outline', color: '#10b981' },
  spent:   { icon: 'remove-circle-outline', color: '#f43f5e' },
  bonus:   { icon: 'star-outline', color: '#f59e0b' },
  default: { icon: 'swap-horizontal-outline', color: '#6b7280' },
};

export default function PointsScreen() {
  const navigation = useNavigation<NavProp>();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'history' | 'store'>('history');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [balRes, txnRes, storeRes] = await Promise.allSettled([
        api.points.balance(),
        api.points.getTransactions(),
        api.points.getStore(),
      ]);
      if (balRes.status === 'fulfilled') setBalance(balRes.value.balance || 0);
      if (txnRes.status === 'fulfilled') {
        const raw = (txnRes.value as any);
        setTransactions(raw.transactions || raw || []);
      }
      if (storeRes.status === 'fulfilled') {
        const raw = (storeRes.value as any);
        setStoreItems(raw.items || raw.services || raw || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="star" size={32} color="#f59e0b" />
          </View>
          <Text style={styles.balanceAmount}>{balance}</Text>
          <Text style={styles.balanceLabel}>Points Balance</Text>
          <View style={styles.balanceTips}>
            <TipItem icon="log-in-outline"      text="Daily login: +5 pts" />
            <TipItem icon="send-outline"        text="Apply to internship: +10 pts" />
            <TipItem icon="document-text-outline" text="Export CV: −50 pts" />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'store' && styles.tabBtnActive]}
            onPress={() => setTab('store')}
          >
            <Text style={[styles.tabText, tab === 'store' && styles.tabTextActive]}>Store</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        {tab === 'history' && (
          <View style={styles.section}>
            {transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={40} color={C.gray300} />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map(txn => {
                const isPositive = txn.points > 0;
                const meta = TXN_ICONS[txn.transaction_type] || TXN_ICONS.default;
                const date = new Date(txn.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                return (
                  <View key={txn.id} style={styles.txnCard}>
                    <View style={[styles.txnIcon, { backgroundColor: meta.color + '18' }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnDesc} numberOfLines={2}>{txn.description}</Text>
                      <Text style={styles.txnDate}>{date}</Text>
                    </View>
                    <Text style={[styles.txnPoints, { color: isPositive ? '#10b981' : '#f43f5e' }]}>
                      {isPositive ? '+' : ''}{txn.points}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Store */}
        {tab === 'store' && (
          <View style={styles.section}>
            {storeItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="storefront-outline" size={40} color={C.gray300} />
                <Text style={styles.emptyText}>No store items available</Text>
              </View>
            ) : (
              storeItems.map(item => (
                <View key={item.id} style={styles.storeCard}>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.storeDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.storeBuy}>
                    <View style={styles.storeCost}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.storeCostText}>{item.cost}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.buyBtn, balance < item.cost && styles.buyBtnDisabled]}
                      disabled={balance < item.cost}
                    >
                      <Text style={styles.buyBtnText}>
                        {balance < item.cost ? 'Not enough' : 'Redeem'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TipItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.7)" />
      <Text style={{ fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' }}>{text}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  balanceCard: {
    backgroundColor: C.primary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  balanceIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  balanceAmount: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 56 },
  balanceLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  balanceTips: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12 },
  tabs: {
    flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.md,
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: 4, borderWidth: 1, borderColor: C.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabBtnActive: { backgroundColor: C.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: C.textSecondary },
  tabTextActive: { color: '#fff' },
  section: { padding: Spacing.md },
  txnCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  txnIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: FontSize.sm, fontWeight: '600', color: C.text, marginBottom: 2 },
  txnDate: { fontSize: FontSize.xs, color: C.gray400 },
  txnPoints: { fontSize: FontSize.base, fontWeight: '800' },
  storeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
    gap: 12,
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: FontSize.base, fontWeight: '700', color: C.text, marginBottom: 2 },
  storeDesc: { fontSize: FontSize.sm, color: C.textSecondary },
  storeBuy: { alignItems: 'flex-end', gap: 8 },
  storeCost: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeCostText: { fontSize: FontSize.sm, fontWeight: '700', color: '#f59e0b' },
  buyBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.md },
  buyBtnDisabled: { backgroundColor: C.gray300 },
  buyBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: FontSize.base, color: C.textSecondary },
});
