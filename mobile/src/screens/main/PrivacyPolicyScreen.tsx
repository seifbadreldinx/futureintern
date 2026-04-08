import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly to us, such as when you create an account, apply for internships, or contact us for support.

This includes: name, email address, university, major, skills, and any other information you choose to provide through your profile.

We also automatically collect certain information when you use the app, including usage data and device information.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:
• Provide, maintain, and improve our services
• Match you with relevant internship opportunities
• Send you notifications about applications and opportunities
• Respond to your comments and questions
• Monitor and analyze usage patterns to improve the app`,
  },
  {
    title: '3. Information Sharing',
    body: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:

• Companies when you apply for their internships (only the information needed for the application)
• Service providers who assist us in operating the app
• Law enforcement when required by applicable law`,
  },
  {
    title: '4. Data Security',
    body: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Your password is encrypted and never stored in plain text. We use secure HTTPS connections for all data transmission.`,
  },
  {
    title: '5. Your Rights',
    body: `You have the right to:
• Access and update your personal information at any time through your profile settings
• Delete your account and associated data by contacting our support team
• Opt out of marketing communications
• Request a copy of your personal data`,
  },
  {
    title: '6. Cookies & Tracking',
    body: `We use minimal tracking technologies to understand how the app is used and to improve your experience. We do not use advertising cookies or third-party trackers for advertising purposes.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the top of this policy and, where appropriate, via push notification.`,
  },
  {
    title: '8. Contact Us',
    body: `If you have any questions about this Privacy Policy, please contact us through the Contact Support section in the app, or email us at privacy@futureintern.app`,
  },
];

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { C } = useTheme();
  const styles = makeStyles(C);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.metaBox}>
          <Ionicons name="shield-checkmark" size={28} color={C.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.metaTitle}>Your Privacy Matters</Text>
            <Text style={styles.metaSub}>Last updated: January 1, 2025</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          FutureIntern is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
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
  metaBox: {
    backgroundColor: C.primary + '12', borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.md, borderWidth: 1, borderColor: C.primary + '30',
  },
  metaTitle: { fontSize: FontSize.base, fontWeight: '700', color: C.text },
  metaSub: { fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 },
  intro: {
    fontSize: FontSize.base, color: C.textSecondary, lineHeight: 24,
    marginBottom: Spacing.md,
  },
  section: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.base, fontWeight: '800', color: C.text, marginBottom: 8 },
  sectionBody: { fontSize: FontSize.sm, color: C.textSecondary, lineHeight: 22 },
});
