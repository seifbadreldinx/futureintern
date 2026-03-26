import React, { useState } from 'react';
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

const API_BASE = 'https://futureintern-production.up.railway.app';

/**
 * Converts any logo URL to an absolute URL the mobile Image component can load.
 * Backend stores 3 formats:
 *  1. Full https:// URL  → use as-is (normalise old Railway paths)
 *  2. /uploads/logos/…  → prepend backend origin
 *  3. /logos/…          → static asset served from frontend (skip on mobile)
 */
const resolveLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Normalise old Railway/localhost URLs that embed /uploads/logos/
    const match = url.match(/\/uploads\/logos\/(.+)$/);
    if (match) return `${API_BASE}/uploads/logos/${match[1]}`;
    return url;
  }
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  // /logos/ static paths are frontend-only — not available on mobile
  return null;
};

/** Resolve logo URL — backend returns it as `profile_image` on the nested company object */
const getLogoUrl = (internship: Internship): string | null => {
  let raw: string | null = null;
  if (internship.company && typeof internship.company === 'object') {
    const co = internship.company as any;
    raw = co.profile_image || co.logo_url || co.company_logo || null;
  }
  if (!raw) raw = internship.company_logo || internship.logo_url || null;
  return resolveLogoUrl(raw);
};

export default function InternshipCard({ internship, onPress, onSave, isSaved }: Props) {
  const { C } = useTheme();
  const styles = makeStyles(C);
  const typeColor = TYPE_COLORS[internship.type] || C.primary;
  const logoUrl = getLogoUrl(internship);
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          {logoUrl && !imgError ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
              onError={() => setImgError(true)}
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
