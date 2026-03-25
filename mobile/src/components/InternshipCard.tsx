import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing, Radius, Shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Internship } from '../types';

interface Props {
  internship: Internship;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'Full-time': '#f43f5e',
  'Part-time': '#2563eb',
  'Remote':    '#059669',
  'Hybrid':    '#7c3aed',
  'On-site':   '#dc2626',
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

/** Resolve logo URL from any of the possible field locations */
const getLogoUrl = (internship: Internship): string | null => {
  if (internship.company_logo) return internship.company_logo;
  if (internship.logo_url) return internship.logo_url;
  if (internship.company && typeof internship.company === 'object') {
    const co = internship.company as any;
    if (co.logo_url) return co.logo_url;
    if (co.company_logo) return co.company_logo;
  }
  return null;
};

export default function InternshipCard({ internship, onPress, onSave, isSaved }: Props) {
  const { C } = useTheme();
  const styles = makeStyles(C);
  const typeColor = TYPE_COLORS[internship.type] || C.primary;
  const logoUrl = getLogoUrl(internship);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitial}>{getCompanyInitial(internship.company)}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.company} numberOfLines={1}>
            {getCompanyName(internship.company) || 'Company'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>{internship.title}</Text>
        </View>
        {onSave && (
          <TouchableOpacity
            onPress={onSave}
            style={styles.saveBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? C.primary : C.gray400}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
          <Text style={[styles.tagText, { color: typeColor }]}>{internship.type}</Text>
        </View>
        {internship.location && (
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={11} color={C.textSecondary} />
            <Text style={styles.tagText}>{internship.location}</Text>
          </View>
        )}
        {internship.is_paid && (
          <View style={styles.paidTag}>
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

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  logoBox: { marginRight: Spacing.sm },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: C.gray100,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: C.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: { fontSize: FontSize.lg, fontWeight: '800', color: C.primary },
  headerInfo: { flex: 1 },
  company: { fontSize: FontSize.sm, color: C.textSecondary, marginBottom: 2 },
  title: { fontSize: FontSize.base, fontWeight: '700', color: C.text, lineHeight: 20 },
  saveBtn: { paddingLeft: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.gray100,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagText: { fontSize: FontSize.xs, color: C.textSecondary, fontWeight: '500' },
  paidTag: { backgroundColor: '#d1fae5', borderColor: '#a7f3d0', borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  paidTagText: { fontSize: FontSize.xs, color: '#065f46', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stipend: { fontSize: FontSize.sm, fontWeight: '700', color: C.primary },
  unpaid: { fontSize: FontSize.sm, color: C.textSecondary },
  deadline: { fontSize: FontSize.xs, color: C.gray400 },
});
