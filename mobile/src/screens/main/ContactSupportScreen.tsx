import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';

const TOPICS = ['General', 'Account & Login', 'Applications', 'Technical Issue', 'Billing', 'Other'];

export default function ContactSupportScreen() {
  const navigation = useNavigation();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields before submitting.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={C.primary} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successSub}>
            We've received your message and will get back to you at{'\n'}
            <Text style={{ fontWeight: '700', color: C.primary }}>{email}</Text>
            {'\n'}within 24 hours.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          <Ionicons name="chatbubbles" size={28} color={C.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>We're here to help</Text>
            <Text style={styles.infoSub}>Fill out the form below and we'll respond within 24 hours.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Your Name" value={name} onChangeText={setName} placeholder="John Doe" C={C} />
          <Sep C={C} />
          <Field label="Email Address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" C={C} />
        </View>

        <Text style={styles.sectionLabel}>Topic</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 0 }}>
            {TOPICS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.topicChip, topic === t && styles.topicChipActive]}
                onPress={() => setTopic(t)}
              >
                <Text style={[styles.topicText, topic === t && styles.topicTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionLabel}>Message</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or question in detail..."
            placeholderTextColor={C.gray400}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending} activeOpacity={0.85}>
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <>
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Send Message</Text>
              </>
            )
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, C }: any) {
  return (
    <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 12 }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.gray400}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'words'}
        style={{ fontSize: FontSize.base, color: C.text, padding: 0 }}
      />
    </View>
  );
}

function Sep({ C }: any) {
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: Spacing.md }} />;
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
  infoBox: {
    backgroundColor: C.primary + '12', borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: C.primary + '30',
  },
  infoTitle: { fontSize: FontSize.base, fontWeight: '700', color: C.text },
  infoSub: { fontSize: FontSize.sm, color: C.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: C.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  card: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  topicChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card,
  },
  topicChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  topicText: { fontSize: FontSize.sm, color: C.textSecondary, fontWeight: '600' },
  topicTextActive: { color: '#fff' },
  messageInput: {
    fontSize: FontSize.base, color: C.text,
    padding: Spacing.md, minHeight: 130,
  },
  sendBtn: {
    backgroundColor: C.primary, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', marginTop: Spacing.md,
  },
  sendBtnText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: C.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: FontSize['2xl'], fontWeight: '900', color: C.text, marginBottom: 12 },
  successSub: { fontSize: FontSize.base, color: C.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: Radius.lg,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  doneBtnText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
