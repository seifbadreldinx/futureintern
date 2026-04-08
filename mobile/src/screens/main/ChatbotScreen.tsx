import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, FlatList, ActivityIndicator,
  SafeAreaView, Keyboard, Animated, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius } from '../../constants/theme';
import { getAuthToken } from '../../services/api';

const API_BASE = 'https://futureintern-production.up.railway.app/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// ─── Welcome message ──────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: 'welcome',
  role: 'bot',
  text: "👋 Hi! I'm **FutureIntern AI** — your personal career assistant.\n\nI can help you with:\n• Finding & applying for internships\n• Resume & CV tips\n• Interview preparation\n• Navigating the platform\n\nWhat's on your mind?",
  timestamp: new Date(),
};

const QUICK_QUESTIONS = [
  'How do I apply for internships?',
  'Give me CV tips',
  'How does AI matching work?',
  'Interview preparation tips',
];

// ─── Fallback responses ───────────────────────────────────────────────────────

const getFallbackResponse = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes('apply') || q.includes('application')) {
    return `To apply for internships on FutureIntern:\n\n1. **Browse Opportunities**: Use the search feature to find internships that match your skills.\n\n2. **Complete Your Profile**: Upload your CV and fill out your profile.\n\n3. **Apply**: Click "Apply Now" on any internship listing.\n\n4. **Wait for Response**: Companies will review your application and contact you if you're a good fit.`;
  }
  if (q.includes('cv') || q.includes('resume')) {
    return `CV tips for internships:\n\n• Keep it to 1 page for students\n• Tailor it to each role you apply for\n• Highlight relevant projects & coursework\n• Include measurable achievements\n• Use the CV Builder tool in your profile!`;
  }
  if (q.includes('match') || q.includes('matching') || q.includes('ai matching')) {
    return `Our AI matching system works like this:\n\n1. **Profile Analysis**: We analyze your profile, skills, and preferences.\n\n2. **Smart Matching**: Our system matches you with internships that align with your profile.\n\n3. **Personalized Picks**: See recommended internships on your dashboard.`;
  }
  if (q.includes('interview')) {
    return `Interview preparation tips:\n\n1. Research the company thoroughly before the interview\n2. Practice common questions:\n   • Tell me about yourself\n   • Why do you want this role?\n   • What are your strengths/weaknesses?\n3. Prepare 2–3 questions to ask the interviewer\n4. Send a thank-you email after!\n\nGood luck! 🎯`;
  }
  if (q.includes('company') || q.includes('companies')) {
    return `Check out the **Companies** tab to browse all companies that post internships on FutureIntern. You can see their open positions, industry, and location.\n\nWhich industry interests you most?`;
  }
  return `I'm here to help with your internship journey! You can ask me about:\n\n- Finding & applying for internships\n- CV writing tips\n- Interview preparation\n- Platform features\n\nWhat would you like to know?`;
};

// ─── Bold text renderer ───────────────────────────────────────────────────────

function BotText({ text, style }: { text: string; style: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const { C, isDark, toggleTheme } = useTheme();
  const S = makeStyles(C, isDark);
  const flatListRef = useRef<FlatList>(null);

  // Typing animation dots
  const dotAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Animate typing dots when loading
  useEffect(() => {
    if (!loading) { dotAnim.forEach(a => a.setValue(0)); return; }
    const loops = dotAnim.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(anim, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [loading]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToEnd(); }, [messages.length]);

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    Keyboard.dismiss();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = await getAuthToken();
      const history = messages.slice(-8).map(m => ({ text: m.text, sender: m.role }));
      const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: content, history }),
      });

      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data.response || data.message || data.reply || '';
      } else if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        reply = data.response || 'You need more points to use the AI chatbot.';
      }

      if (!reply) reply = getFallbackResponse(content);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: getFallbackResponse(content),
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Message renderer ────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const timeStr = item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[S.msgRow, isUser && S.msgRowUser]}>
        {!isUser && (
          <View style={S.botAvatar}>
            <Ionicons name="hardware-chip-outline" size={16} color="#fff" />
          </View>
        )}
        <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleBot]}>
          {isUser
            ? <Text style={S.bubbleTextUser}>{item.text}</Text>
            : <BotText text={item.text} style={S.bubbleTextBot} />
          }
          <Text style={[S.timeText, { color: isUser ? 'rgba(255,255,255,0.55)' : C.gray400 }]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  // ── Typing dots Footer ──────────────────────────────────────────────────────

  const TypingIndicator = () => (
    <View style={S.msgRow}>
      <View style={S.botAvatar}>
        <Ionicons name="hardware-chip-outline" size={16} color="#fff" />
      </View>
      <View style={[S.bubble, S.bubbleBot]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3 }}>
          {dotAnim.map((anim, i) => (
            <Animated.View
              key={i}
              style={[S.typingDot, {
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
              }]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ── Header ── */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          {/* Pink AI avatar */}
          <View style={[S.headerAvatar, { backgroundColor: '#0f172a', borderColor: '#f43f5e', borderWidth: 2 }]}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#f43f5e" />
            {/* Online dot badge */}
            <View style={[S.onlineBadge, { backgroundColor: '#10b981', bottom: -2, right: -4 }]} />
          </View>
          <View>
            <Text style={[S.headerTitle, { color: '#fff' }]}>FutureIntern AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Text style={{ fontSize: 10 }}>✨</Text>
              <Text style={[S.headerSub, { color: '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }]}>POWERED BY HUGGING FACE</Text>
            </View>
          </View>
        </View>

        <View style={S.headerActions}>
          {/* Theme toggle */}
          <TouchableOpacity style={S.headerBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={17} color="#94a3b8" />
          </TouchableOpacity>
          {/* Clear chat */}
          <TouchableOpacity style={S.headerBtn} onPress={() => setMessages([WELCOME])}>
            <Ionicons name="refresh-outline" size={17} color="#94a3b8" />
          </TouchableOpacity>
          {/* Close */}
          <TouchableOpacity style={S.headerBtn} onPress={() => (navigation as any).goBack()}>
            <Ionicons name="close" size={17} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pink accent stripe */}
      <View style={S.accentStripe}>
        <View style={S.accentLine} />
        <Text style={S.accentText}>AI ASSISTANT</Text>
        <View style={S.accentLine} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Messages ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={S.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
        />

        {/* ── Quick Questions (only when just welcome) ── */}
        {messages.length === 1 && !loading && (
          <View style={S.quickSection}>
            <Text style={S.quickLabel}>✨ QUICK QUESTIONS</Text>
            <View style={S.quickGrid}>
              {QUICK_QUESTIONS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={S.quickCard}
                  onPress={() => sendMessage(q)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="sparkles-outline" size={13} color="#f43f5e" style={{ marginBottom: 4 }} />
                  <Text style={S.quickText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Input area ── */}
        <View style={S.inputArea}>
          <View style={S.inputRow}>
            <View style={S.inputWrap}>
              <TextInput
                style={S.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything…"
                placeholderTextColor={C.gray400}
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage()}
              />
            </View>
            <TouchableOpacity
              style={[S.sendBtn, (!input.trim() || loading) && S.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>
          <Text style={S.inputHint}>Powered by FutureIntern AI · Your data is secure</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (C: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },

  // ── Header (always dark navy, matching website) ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 4 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  onlineBadge: {
    position: 'absolute', bottom: -2, right: -4,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0f172a',
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  headerSub: { fontSize: 10, fontWeight: '600', color: '#64748b', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  // Pink accent stripe
  accentStripe: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: Spacing.md, paddingBottom: 10, gap: 10,
  },
  accentLine: { flex: 1, height: 1, backgroundColor: '#f43f5e', opacity: 0.35 },
  accentText: { fontSize: 9, fontWeight: '800', color: '#f43f5e', letterSpacing: 1.5 },

  // ── Messages ──
  messageList: {
    padding: Spacing.md, paddingTop: 16, flexGrow: 1,
    backgroundColor: C.background,
  },

  msgRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginBottom: 12,
  },
  msgRowUser: { flexDirection: 'row-reverse' },

  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5, borderColor: '#fda4af',
  },

  bubble: {
    maxWidth: '78%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#f43f5e',
    borderBottomRightRadius: 4,
    marginLeft: 8,
  },
  bubbleBot: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 4, elevation: 2,
  },
  bubbleTextUser: { fontSize: FontSize.base, color: '#fff', lineHeight: 22 },
  bubbleTextBot: { fontSize: FontSize.base, color: C.text, lineHeight: 22 },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#f43f5e', opacity: 0.85,
  },

  // ── Quick questions ──
  quickSection: {
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: C.background,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  quickLabel: {
    fontSize: 10, fontWeight: '800', color: '#f43f5e',
    letterSpacing: 1, marginBottom: 10,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: {
    backgroundColor: C.card,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
    width: '47%',
  },
  quickText: { fontSize: FontSize.sm, fontWeight: '700', color: C.text, lineHeight: 18 },

  // ── Input area ──
  inputArea: {
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: 22,
    borderWidth: 2, borderColor: '#f43f5e',
    paddingHorizontal: 14, paddingVertical: 8,
    minHeight: 44,
  },
  input: {
    fontSize: FontSize.base, color: C.text,
    maxHeight: 100, paddingVertical: 0,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.35, shadowOpacity: 0 },
  inputHint: {
    fontSize: 9, fontWeight: '600', color: C.gray400,
    textAlign: 'center', marginTop: 6, letterSpacing: 0.3,
  },
});
