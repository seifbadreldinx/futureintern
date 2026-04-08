import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';

const FAQS = [
  {
    q: 'How do I apply for an internship?',
    a: 'Browse internships on the Browse tab, tap any listing to view details, then tap "Apply Now". Your application will be submitted instantly.',
  },
  {
    q: 'How do I track my applications?',
    a: 'Go to the Applications tab from the navigation bar, or visit Profile → My Applications to see all your submitted applications and their status.',
  },
  {
    q: 'What are Points & Rewards?',
    a: 'You earn points by completing your profile, applying to internships, and engaging with the platform. Points can be redeemed for premium features.',
  },
  {
    q: 'How do I update my profile?',
    a: 'Go to Profile → Edit Profile. You can update your name, bio, skills, university, major, and upload a profile photo.',
  },
  {
    q: 'Can I save internships for later?',
    a: 'Yes! Tap the bookmark icon on any internship detail page to save it. View all saved internships in the Saved tab.',
  },
  {
    q: 'How does the CV Builder work?',
    a: 'Go to Profile → My CV to access the CV Builder. Add sections for education, experience, skills, and more. You can export it as a PDF.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot password?" and enter your email. You\'ll receive a reset link within a few minutes.',
  },
  {
    q: 'Are the internships paid?',
    a: 'Each listing shows whether it\'s paid or unpaid. Look for the "Paid" badge on internship cards and the Stipend field on the detail page.',
  },
];

export default function HelpCenterScreen() {
  const navigation = useNavigation();
  const { C } = useTheme();
  const styles = makeStyles(C);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroBox}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-circle" size={36} color={C.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers to commonly asked questions below.</Text>
        </View>

        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>

        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqCard}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.faqRow}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={C.textSecondary}
              />
            </View>
            {expanded === i && (
              <Text style={styles.faqA}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backBtn: { padding: 4, marginRight: 16 },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: '800', color: '#fff', textAlign: 'center' },
  scroll: { padding: Spacing.md },
  heroBox: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: C.border,
    ...Shadow.sm,
  },
  heroIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: C.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '800', color: C.text, marginBottom: 6 },
  heroSub: { fontSize: FontSize.sm, color: C.textSecondary, textAlign: 'center' },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: C.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: C.border,
    padding: Spacing.md, marginBottom: 10,
    ...Shadow.sm,
  },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: C.text, marginRight: 8 },
  faqA: { fontSize: FontSize.sm, color: C.textSecondary, lineHeight: 22, marginTop: 10 },
});
