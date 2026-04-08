import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { Internship, RootStackParamList } from '../../types';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type RouteType = RouteProp<RootStackParamList, 'CompanyOpenings'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function CompanyOpeningsScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { companyId, companyName } = route.params;
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [companyId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.internships.list({ company_id: companyId });
      const list: Internship[] = (res.internships ?? res ?? []).filter(
        (i: any) => {
          const cid = i.company_id ?? i.company?.id;
          return String(cid) === String(companyId);
        }
      );
      setInternships(list);
    } catch {
      Alert.alert('Error', 'Could not load internships for this company.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Internship }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InternshipDetail', { id: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={12} color={C.textSecondary} /> {item.location || 'Location not specified'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.gray400} />
      </View>
      <View style={styles.tags}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{companyName}</Text>
          <Text style={styles.headerSub}>Open Internships</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : internships.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="briefcase-outline" size={52} color={C.gray300} />
          <Text style={styles.emptyTitle}>No open positions</Text>
          <Text style={styles.emptySub}>{companyName} has no active internships at the moment.</Text>
        </View>
      ) : (
        <FlatList
          data={internships}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{internships.length} open position{internships.length !== 1 ? 's' : ''}</Text>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: C.text, marginTop: 16 },
  emptySub: { fontSize: FontSize.sm, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
  list: { padding: Spacing.md },
  count: { fontSize: FontSize.sm, fontWeight: '700', color: C.textSecondary, marginBottom: Spacing.md },
  card: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: C.border, ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: FontSize.base, fontWeight: '800', color: C.text, marginBottom: 4, flex: 1, marginRight: 8 },
  location: { fontSize: FontSize.xs, color: C.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: C.background, borderRadius: Radius.full,
    borderWidth: 1, borderColor: C.border,
  },
  tagText: { fontSize: FontSize.xs, color: C.textSecondary, fontWeight: '600' },
  paidTag: { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  paidTagText: { color: '#065f46' },
});
