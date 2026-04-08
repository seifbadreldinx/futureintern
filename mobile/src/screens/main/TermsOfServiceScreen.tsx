import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, accessing, or using the FutureIntern mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.`,
  },
  {
    title: '2. Eligibility',
    body: `FutureIntern is intended for students and recent graduates seeking internship opportunities. You must be at least 16 years old to use this service. By using the app, you represent and warrant that you meet these requirements.`,
  },
  {
    title: '3. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
• Provide accurate and complete information when creating your account
• Update your information to keep it accurate and current
• Notify us immediately of any unauthorized use of your account
• Not share your account with others`,
  },
  {
    title: '4. Acceptable Use',
    body: `You agree not to use FutureIntern to:
• Post false, misleading, or fraudulent information
• Harass, abuse, or harm other users or companies
• Violate any applicable laws or regulations
• Attempt to gain unauthorized access to any part of the service
• Use automated tools to scrape or collect data from the platform`,
  },
  {
    title: '5. Internship Applications',
    body: `When you apply for an internship through FutureIntern, your profile information is shared with the respective company. You are solely responsible for the accuracy of your application information.

FutureIntern does not guarantee job offers or the quality of any internship posted on the platform. We act as an intermediary between students and companies.`,
  },
  {
    title: '6. Points & Rewards',
    body: `Points earned through the FutureIntern platform have no cash value and cannot be transferred, sold, or exchanged for currency. FutureIntern reserves the right to modify, suspend, or terminate the points program at any time.`,
  },
  {
    title: '7. Intellectual Property',
    body: `The FutureIntern app and its content, features, and functionality are owned by FutureIntern and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written consent.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `FutureIntern shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.

Our total liability shall not exceed the amount paid by you, if any, for accessing the service in the past 12 months.`,
  },
  {
    title: '9. Changes to Terms',
    body: `We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the top of these terms and, where appropriate, via push notification or email.`,
  },
  {
    title: '10. Contact',
    body: `For any questions about these Terms of Service, please contact us through the Contact Support section in the app, or email legal@futureintern.app`,
  },
];

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { C } = useTheme();
  const styles = makeStyles(C);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.metaBox}>
          <Ionicons name="document-text" size={28} color={C.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.metaTitle}>Terms of Service</Text>
            <Text style={styles.metaSub}>Effective date: January 1, 2025</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Please read these Terms of Service carefully before using the FutureIntern app. These terms govern your use of our services.
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
