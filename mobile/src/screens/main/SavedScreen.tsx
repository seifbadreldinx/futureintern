import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Platform,
  Text, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { api } from '../../services/api';
import { Internship, TabScreenNavProp } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import InternshipCard from '../../components/InternshipCard';
import EmptyState from '../../components/EmptyState';

export default function SavedScreen() {
  const navigation = useNavigation<TabScreenNavProp>();
  const [saved, setSaved] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await api.internships.saved();
      setSaved(data.saved_internships || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSaved(); }, [loadSaved]));

  const handleUnsave = async (id: number) => {
    setSaved(prev => prev.filter(i => i.id !== id));
    try {
      await api.internships.unsave(id);
    } catch {
      loadSaved(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Internships</Text>
        <Text style={styles.headerSub}>
          {saved.length > 0 ? `${saved.length} saved` : 'Your bookmarks'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadSaved(true)}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No saved internships"
              subtitle="Bookmark internships you're interested in to find them here quickly"
              actionLabel="Browse Internships"
              onAction={() => navigation.navigate('Browse')}
            />
          }
          renderItem={({ item }) => (
            <InternshipCard
              internship={item}
              isSaved
              onSave={() => handleUnsave(item.id)}
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
    paddingBottom: 24,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.md, flexGrow: 1 },
});
