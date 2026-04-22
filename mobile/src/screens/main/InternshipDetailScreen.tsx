import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { api } from '../../services/api';
import { Internship } from '../../types';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = 'https://futureintern-production.up.railway.app';

const getCompanyName = (company: any): string => {
  if (!company) return '';
  if (typeof company === 'object') return company.name || company.company_name || '';
  return String(company);
};

const FRONTEND_BASE = 'https://futureintern-two.vercel.app';

function resolveLogoUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const match = url.match(/\/uploads\/logos\/(.+)$/);
    if (match) return `${API_BASE}/uploads/logos/${match[1]}`;
    return url;
  }
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  if (url.startsWith('/logos/')) return `${FRONTEND_BASE}${url}`;
  return null;
}

// ─── Company Logo ─────────────────────────────────────────────────────────────

function CompanyLogo({ internship }: { internship: any }) {
  const companyObj = internship.company;
  const companyName =
    getCompanyName(companyObj) ||
    internship.company_name ||
    internship.title?.split(' ')[0] ||
    'Co';

  // Try every possible logo field (direct + nested inside company object)
  const rawLogo =
    internship.company_logo_url ||
    internship.logo_url ||
    internship.company_logo ||
    (companyObj && typeof companyObj === 'object'
      ? companyObj.logo_url ||
        companyObj.logo ||
        companyObj.profile_image ||
        companyObj.company_logo_url ||
        companyObj.image
      : null) ||
    null;

  const resolved = resolveLogoUrl(rawLogo);
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=ffe4e6&color=f43f5e&size=128&bold=true&format=png`;

  const [src, setSrc] = useState<string>(resolved || fallback);

  // Reset when internship changes
  useEffect(() => {
    setSrc(resolved || fallback);
  }, [internship.id]);

  return (
    <View style={logoS.wrap}>
      <Image
        source={{ uri: src }}
        style={logoS.img}
        resizeMode="contain"
        onError={() => setSrc(fallback)}
      />
    </View>
  );
}

const logoS = StyleSheet.create({
  wrap: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  img: { width: 64, height: 64 },
});

// ─── Bullet list renderer ─────────────────────────────────────────────────────

function BulletList({ text, color }: { text: string; color: string }) {
  const lines = text
    .split('\n')
    .map(l => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <View>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color, marginTop: 7, marginRight: 8, flexShrink: 0 }} />
          <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, flex: 1 }}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InternshipDetail'>;
  route: RouteProp<RootStackParamList, 'InternshipDetail'>;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InternshipDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { C } = useTheme();

  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [detailRes, savedRes] = await Promise.allSettled([
        api.internships.detail(id),
        api.internships.saved(),
      ]);

      if (detailRes.status === 'rejected') {
        Alert.alert('Error', 'Failed to load internship details.');
        navigation.goBack();
        return;
      }

      const raw = (detailRes as any).value;
      const intern = raw?.internship ?? raw;
      setInternship(intern);

      if (savedRes.status === 'fulfilled') {
        const savedIds = ((savedRes as any).value.saved_internships || []).map((i: any) => i.id);
        setIsSaved(savedIds.includes(id));
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

  // Apply — always open external URL, exactly like the website
  const handleApply = async () => {
    if (applying) return;
    setApplying(true);
    try {
      // Pick first available external URL
      const externalUrl =
        internship?.application_link ||
        internship?.application_url ||
        internship?.apply_url ||
        internship?.external_url ||
        internship?.apply_link ||
        internship?.url ||
        (internship?.company && typeof internship.company === 'object'
          ? internship.company.website || internship.company.url
          : null) ||
        null;

      if (externalUrl) {
        // Record internally (best-effort, ignore errors)
        api.applications.apply(id).catch(() => {});
        await Linking.openURL(externalUrl);
      } else {
        // Fallback: submit internal application
        await api.applications.apply(id);
        Alert.alert('🎉 Application Submitted!', 'Your application has been submitted. Good luck!');
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('duplicate')) {
        Alert.alert('Already Applied', 'You have already applied for this internship.');
      } else {
        Alert.alert('Error', err?.message || 'Could not submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!internship) return null;

  const companyName = getCompanyName(internship.company) || internship.company_name || '';
  const companyAbout =
    (internship.company && typeof internship.company === 'object'
      ? internship.company.description || internship.company.about || internship.company.bio
      : null) || internship.company_description || '';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>

      {/* ── Nav bar ── */}
      <View style={[S.navBar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.navBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[S.navTitle, { color: C.text }]} numberOfLines={1}>{internship.title}</Text>
        <TouchableOpacity onPress={handleSave} style={S.navBtn}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? Colors.primary : C.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero card — logo + title + Apply Now ── */}
        <View style={[S.heroCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <CompanyLogo internship={internship} />
          <Text style={[S.heroTitle, { color: C.text }]}>{internship.title}</Text>
          <Text style={[S.heroCompany, { color: C.textSecondary }]}>{companyName}</Text>

          {/* Location + Type chips */}
          <View style={S.tagRow}>
            {internship.location ? (
              <View style={[S.tag, { backgroundColor: C.background, borderColor: C.border }]}>
                <Ionicons name="location-outline" size={13} color={C.textSecondary} />
                <Text style={[S.tagText, { color: C.textSecondary }]}>{internship.location}</Text>
              </View>
            ) : null}
            {internship.type ? (
              <View style={[S.tag, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '50' }]}>
                <Text style={{ fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' }}>
                  {internship.type?.toLowerCase() === internship.location?.toLowerCase()
                    ? 'Full-time'
                    : internship.type}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Divider */}
          <View style={[S.divider, { backgroundColor: C.border }]} />

          {/* Apply Now button — inside hero card, like website */}
          <TouchableOpacity
            style={[S.applyHeroBtn, applying && { opacity: 0.7 }]}
            onPress={handleApply}
            disabled={applying}
            activeOpacity={0.85}
          >
            {applying
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                  <Text style={S.applyHeroBtnText}>Apply Now</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* ── About the Role ── */}
        {internship.description ? (
          <View style={[S.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[S.sectionLabel, { color: C.text }]}>ABOUT THE ROLE</Text>
            <Text style={[S.bodyText, { color: C.textSecondary }]}>{internship.description}</Text>
          </View>
        ) : null}

        {/* ── Responsibilities & Requirements — 2-column grid like website ── */}
        {(internship.responsibilities || internship.requirements) ? (
          <View style={S.twoCol}>
            {internship.responsibilities ? (
              <View style={[S.halfCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={S.halfCardHeader}>
                  <Ionicons name="briefcase-outline" size={15} color={Colors.primary} />
                  <Text style={[S.halfCardTitle, { color: C.text }]}>Responsibilities</Text>
                </View>
                <BulletList text={internship.responsibilities} color={Colors.primary} />
              </View>
            ) : null}
            {internship.requirements ? (
              <View style={[S.halfCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={S.halfCardHeader}>
                  <Ionicons name="calendar-outline" size={15} color="#3b82f6" />
                  <Text style={[S.halfCardTitle, { color: C.text }]}>Requirements</Text>
                </View>
                <BulletList text={internship.requirements} color="#3b82f6" />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Skills Required ── */}
        {internship.skills_required && internship.skills_required.length > 0 ? (
          <View style={[S.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[S.sectionLabel, { color: C.text }]}>SKILLS REQUIRED</Text>
            <View style={S.skillsRow}>
              {internship.skills_required.map((skill: string, i: number) => (
                <View key={i} style={[S.skillChip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}>
                  <Text style={{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' }}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── About the Company ── */}
        {companyName ? (
          <View style={[S.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[S.sectionLabel, { color: C.text }]}>ABOUT {companyName.toUpperCase()}</Text>
            <Text style={[S.bodyText, { color: C.textSecondary }]}>
              {companyAbout ||
                `${companyName} is a leading company in the industry, committed to innovation and excellence. We provide a supportive environment where interns can learn, grow, and make meaningful contributions to our team.`}
            </Text>
          </View>
        ) : null}

      </ScrollView>

      {/* ── Sticky bottom Apply bar ── */}
      <View style={[S.bottomBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[S.applyBtn, applying && { opacity: 0.7 }]}
          onPress={handleApply}
          disabled={applying}
          activeOpacity={0.85}
        >
          {applying
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.applyBtnText}>Apply Now</Text>}
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  navBtn: { padding: 6, width: 38 },
  navTitle: {
    flex: 1, fontSize: FontSize.base, fontWeight: '700',
    textAlign: 'center', marginHorizontal: 4,
  },

  // Hero card
  heroCard: {
    margin: Spacing.md, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center',
    borderWidth: 1.5, ...Shadow.sm,
  },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  heroCompany: { fontSize: FontSize.base, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  tagText: { fontSize: FontSize.xs },
  divider: { height: 1, width: '100%', marginBottom: 16 },

  // Apply button inside hero
  applyHeroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: Radius.md,
  },
  applyHeroBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },

  // Content cards
  card: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1.5, ...Shadow.sm,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '900', letterSpacing: 0.8,
    marginBottom: 12,
  },
  bodyText: { fontSize: FontSize.base, lineHeight: 24 },

  // 2-col cards (Responsibilities + Requirements)
  twoCol: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  halfCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, ...Shadow.sm,
  },
  halfCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  halfCardTitle: { fontSize: FontSize.sm, fontWeight: '800' },

  // Skills
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    borderTopWidth: 1,
  },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
