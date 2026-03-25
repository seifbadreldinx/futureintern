import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../constants/theme';
import { Internship } from '../types';

interface Props {
  internship: Internship;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'Full-time': Colors.primary,
  'Part-time': Colors.accent,
  'Remote': '#059669',
  'Hybrid': '#7c3aed',
  'On-site': '#dc2626',
};

const getCompanyName = (company: any): string => {
  if (!company) return '';
  if (typeof company === 'object') return company.name || '';
  return String(company);
};

const getCompanyInitial = (company: any): string => {
  const name = getCompanyName(company);
  return name[0]?.toUpperCase() || 'C';
};

export default function InternshipCard({ internship, onPress, onSave, isSaved }: Props) {
  const typeColor = TYPE_COLORS[internship.type] || Colors.primary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          {internship.company_logo ? (
            <Image source={{ uri: internship.company_logo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitial}>{getCompanyInitial(internship.company)}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.company} numberOfLines={1}>{getCompanyName(internship.company) || 'Company'}</Text>
          <Text style={styles.title} numberOfLines={2}>{internship.title}</Text>
        </View>
        {onSave && (
          <TouchableOpacity onPress={onSave} style={styles.saveBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? Colors.primary : Colors.gray400}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tags row */}
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
          <Text style={[styles.tagText, { color: typeColor }]}>{internship.type}</Text>
        </View>
        {internship.location && (
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.tagText}>{internship.location}</Text>
          </View>
        )}
        {internship.is_paid && (
          <View style={[styles.tag, styles.paidTag]}>
            <Text style={styles.paidTagText}>Paid</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {internship.stipend ? (
          <Text style={styles.stipend}>{internship.stipend}</Text>
        ) : (
          <Text style={styles.unpaid}>Unpaid</Text>
        )}
        <Text style={styles.deadline}>
          {internship.deadline
            ? `Deadline: ${new Date(internship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  logoBox: { marginRight: Spacing.sm },
  logo: { width: 44, height: 44, borderRadius: Radius.sm },
  logoPlaceholder: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  headerInfo: { flex: 1 },
  company: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  title: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  saveBtn: { paddingLeft: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: Colors.gray100, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  paidTag: { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  paidTagText: { fontSize: FontSize.xs, color: '#065f46', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stipend: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  unpaid: { fontSize: FontSize.sm, color: Colors.textSecondary },
  deadline: { fontSize: FontSize.xs, color: Colors.gray400 },
});
