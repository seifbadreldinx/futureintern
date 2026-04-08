import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { api } from '../../services/api';

const getCompanyName = (company: any): string => {
  if (!company) return '';
  if (typeof company === 'object') return company.name || '';
  return String(company);
};
import { Internship } from '../../types';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InternshipDetail'>;
  route: RouteProp<RootStackParamList, 'InternshipDetail'>;
};

export default function InternshipDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [detailRes, savedRes, appsRes] = await Promise.allSettled([
        api.internships.detail(id),
        api.internships.saved(),
        api.applications.list(),
      ]);
      if (detailRes.status === 'rejected') {
        Alert.alert('Error', 'Failed to load internship details.');
        navigation.goBack();
        return;
      }
      // API returns { internship: {...} } or the object directly
      const raw = detailRes.value;
      setInternship(raw?.internship ?? raw);
      if (savedRes.status === 'fulfilled') {
        const savedIds = (savedRes.value.saved_internships || []).map((i: Internship) => i.id);
        setIsSaved(savedIds.includes(id));
      }
      if (appsRes.status === 'fulfilled') {
        const apps = appsRes.value?.applications ?? appsRes.value ?? [];
        const appliedIds = apps.map((a: any) => a.internship_id ?? a.internship?.id);
        setHasApplied(appliedIds.includes(id));
      }
    } catch {
      Alert.alert('Error', 'Failed to load internship details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const was = isSaved;
    setIsSaved(!was);
    try {
      if (was) await api.internships.unsave(id);
      else await api.internships.save(id);
    } catch {
      setIsSaved(was);
    }
  };

  const handleApply = async () => {
    if (hasApplied) return;
    Alert.alert(
      'Apply Now',
      `Apply for "${internship?.title}" at ${getCompanyName(internship?.company)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplying(true);
            try {
              await api.applications.apply(id);
              setHasApplied(true);
              Alert.alert('Success!', 'Your application has been submitted.');
            } catch (err: any) {
              Alert.alert('Failed', err.message || 'Could not submit application.');
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!internship) return null;

  const deadlineDate = internship.deadline
    ? new Date(internship.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{internship.title}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? Colors.primary : Colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.companyInitialBox}>
            <Text style={styles.companyInitial}>{(getCompanyName(internship.company) || 'C')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.heroTitle}>{internship.title}</Text>
          <Text style={styles.heroCompany}>{getCompanyName(internship.company)}</Text>

          {/* Tags */}
          <View style={styles.tagRow}>
            {internship.location && (
              <View style={styles.tag}>
                <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.tagText}>{internship.location}</Text>
              </View>
            )}
            <View style={[styles.tag, styles.typeTag]}>
              <Text style={styles.typeTagText}>{internship.type}</Text>
            </View>
            {internship.is_paid && (
              <View style={[styles.tag, styles.paidTag]}>
                <Text style={styles.paidTagText}>Paid</Text>
              </View>
            )}
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            {internship.stipend && (
              <View style={styles.stat}>
                <Ionicons name="cash-outline" size={16} color={Colors.primary} />
                <Text style={styles.statLabel}>Stipend</Text>
                <Text style={styles.statValue}>{internship.stipend}</Text>
              </View>
            )}
            {internship.duration && (
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{internship.duration}</Text>
              </View>
            )}
            {deadlineDate && (
              <View style={styles.stat}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={styles.statLabel}>Deadline</Text>
                <Text style={styles.statValue}>{deadlineDate}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {internship.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this role</Text>
            <Text style={styles.bodyText}>{internship.description}</Text>
          </View>
        )}

        {/* Requirements */}
        {internship.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.bodyText}>{internship.requirements}</Text>
          </View>
        )}

        {/* Skills */}
        {internship.skills_required && internship.skills_required.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillsRow}>
              {internship.skills_required.map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.applyBtn, (hasApplied || applying) && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={hasApplied || applying}
          activeOpacity={0.85}
        >
          {applying
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.applyBtnText}>{hasApplied ? 'Applied' : 'Apply Now'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBtn: { padding: 4 },
  navTitle: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.text, textAlign: 'center', marginHorizontal: 8 },
  scrollContent: { padding: Spacing.md },
  heroCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    alignItems: 'center', ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  companyInitialBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  companyInitial: { fontSize: FontSize['2xl'], fontWeight: '900', color: Colors.primary },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 4 },
  heroCompany: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Colors.gray100, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  typeTag: { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '40' },
  typeTagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  paidTag: { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  paidTagText: { fontSize: FontSize.xs, color: '#065f46', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  stat: { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  section: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  bodyText: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 24 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
  },
  skillText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  bottomBar: {
    backgroundColor: Colors.white, padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnDisabled: { backgroundColor: Colors.gray400 },
  applyBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
