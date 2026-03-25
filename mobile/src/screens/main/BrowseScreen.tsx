import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { api } from '../../services/api';
import { Internship, TabScreenNavProp } from '../../types';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import InternshipCard from '../../components/InternshipCard';
import EmptyState from '../../components/EmptyState';

const TYPES = ['All', 'Full-time', 'Part-time', 'Remote', 'Hybrid'];

export default function BrowseScreen() {
  const navigation = useNavigation<TabScreenNavProp>();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PER_PAGE = 10;

  const fetchInternships = useCallback(async (pg = 1, reset = false) => {
    if (pg === 1) reset ? setLoading(true) : setRefreshing(true);
    else setLoadingMore(true);

    try {
      const params: Record<string, any> = { page: pg, per_page: PER_PAGE };
      if (search) params.search = search;
      if (selectedType !== 'All') params.type = selectedType;

      const data = await api.internships.list(params);
      const items: Internship[] = data.internships || [];
      setInternships(prev => pg === 1 ? items : [...prev, ...items]);
      setHasMore(items.length === PER_PAGE);
      setPage(pg);
    } catch {
      // silently fail on pagination
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, selectedType]);

  useEffect(() => {
    fetchInternships(1, true);
  }, [fetchInternships]);

  useEffect(() => {
    api.internships.saved().then(data => {
      const ids = (data.saved_internships || []).map((i: Internship) => i.id);
      setSavedIds(new Set(ids));
    }).catch(() => {});
  }, []);

  const handleSave = async (id: number) => {
    const wasSaved = savedIds.has(id);
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (wasSaved) await api.internships.unsave(id);
      else await api.internships.save(id);
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchInternships(page + 1);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Internships</Text>
        <Text style={styles.headerSub}>Find your perfect opportunity</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or company..."
            placeholderTextColor={Colors.gray400}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={TYPES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          keyExtractor={t => t}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedType === item && styles.filterChipActive]}
              onPress={() => setSelectedType(item)}
            >
              <Text style={[styles.filterText, selectedType === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={internships}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInternships(1)}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="No internships found"
              subtitle="Try adjusting your search or filters"
              actionLabel="Clear filters"
              onAction={() => { setSearch(''); setSearchInput(''); setSelectedType('All'); }}
            />
          }
          renderItem={({ item }) => (
            <InternshipCard
              internship={item}
              isSaved={savedIds.has(item.id)}
              onSave={() => handleSave(item.id)}
              onPress={() => navigation.navigate('InternshipDetail', { id: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 16, marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.text },
  filtersContainer: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtersList: { paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.gray100,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.white, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.md, flexGrow: 1 },
});
