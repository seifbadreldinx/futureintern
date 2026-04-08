import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, FlatList, ActivityIndicator,
  SafeAreaView, Keyboard, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius } from '../../constants/theme';
import { getAuthToken } from '../../services/api';

const API_BASE = 'https://futureintern-production.up.railway.app/api';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

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

// Rule-based fallback matching the web chatbotService
const getFallbackResponse = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes('apply') || q.includes('application')) {
    return `To apply for internships on FutureIntern:\n\n1. **Browse Opportunities**: Use the search feature to find internships that match your skills.\n\n2. **Create an Account**: Sign up for a free account if you haven't already.\n\n3. **Complete Your Profile**: Upload your CV and fill out your profile.\n\n4. **Apply**: Click "Apply Now" on any internship listing. Track your applications in your dashboard.\n\n5. **Wait for Response**: Companies will review your application and contact you if you're a good fit.`;
  }
  if (q.includes('cv') || q.includes('resume')) {
    return `CV tips for internships:\n\n• Keep it to 1 page for students\n• Tailor it to each role you apply for\n• Highlight relevant projects & coursework\n• Include measurable achievements\n• Use the CV Builder tool in your profile!\n\nWe accept PDF & DOCX formats. Keep it updated!`;
  }
  if (q.includes('match') || q.includes('matching') || q.includes('ai matching')) {
    return `Our AI matching system works like this:\n\n1. **Profile Analysis**: We analyze your profile, skills, and preferences.\n\n2. **Smart Matching**: Our system matches you with internships that align with your profile.\n\n3. **Personalized Picks**: See recommended internships on your dashboard.\n\n4. **Continuous Learning**: The more you interact, the better the recommendations!`;
  }
  if (q.includes('interview')) {
    return `Interview preparation tips:\n\n1. Research the company thoroughly before the interview\n2. Practice common questions:\n   • Tell me about yourself\n   • Why do you want this role?\n   • What are your strengths/weaknesses?\n3. Prepare 2-3 questions to ask the interviewer\n4. Review your CV and be ready to expand on anything\n5. Send a thank-you email after!\n\nGood luck! 🎯`;
  }
  if (q.includes('company') || q.includes('companies')) {
    return `Check out the **Companies** tab to browse all companies that post internships on FutureIntern. You can see their open positions, industry, and location.\n\nWhich industry interests you most?`;
  }
  return `I'm here to help with your internship journey! You can ask me about:\n\n- Finding & applying for internships\n- CV writing tips\n- Interview preparation\n- Platform features\n\nWhat would you like to know?`;
};

function renderBotText(text: string, textStyle: any) {
  // Simple bold rendering: **text** → bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={textStyle}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const { C, isDark } = useTheme();
  const S = makeStyles(C, isDark);
  const flatListRef = useRef<FlatList>(null);
  const dotAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Animate typing dots
  useEffect(() => {
    if (!loading) return;
    const loops = dotAnim.map((anim, i) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    });
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [loading]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => { if (messages.length > 1) scrollToEnd(); }, [messages]);

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

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const timeStr = item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[S.msgRow, isUser && S.msgRowUser]}>
        {!isUser && (
          <View style={S.botAvatar}>
            <Ionicons name="hardware-chip-outline" size={18} color="#fff" />
          </View>
        )}
        <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleBot]}>
          {isUser
            ? <Text style={S.bubbleTextUser}>{item.text}</Text>
            : renderBotText(item.text, S.bubbleTextBot)
          }
          <Text style={[S.timeText, { color: isUser ? 'rgba(255,255,255,0.6)' : '#94a3b8' }]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={S.safe}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <View style={S.headerAvatar}>
            <Ionicons name="hardware-chip-outline" size={22} color="#fff" />
          </View>
          <View>
            <Text style={S.headerTitle}>FutureIntern AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="star" size={10} color="#f59e0b" />
              <Text style={S.headerPowered}>POWERED BY HUGGING FACE</Text>
            </View>
          </View>
        </View>
        <View style={S.headerRight}>
          <TouchableOpacity
            style={S.headerBtn}
            onPress={() => setMessages([WELCOME])}
          >
            <Ionicons name="refresh-outline" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={S.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Online indicator line */}
      <View style={S.onlineBar}>
        <View style={S.onlineDot} />
        <View style={S.onlineBarFill} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={S.messageList}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDark ? 'white' : 'black'}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={loading ? (
            <View style={[S.msgRow]}>
              <View style={S.botAvatar}>
                <Ionicons name="hardware-chip-outline" size={18} color="#fff" />
              </View>
              <View style={[S.bubble, S.bubbleBot]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 }}>
                  {dotAnim.map((anim, i) => (
                    <Animated.View
                      key={i}
                      style={[S.typingDot, { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        />

        {/* Quick Questions */}
        {messages.length === 1 && !loading && (
          <View style={S.quickSection}>
            <Text style={S.quickLabel}>QUICK QUESTIONS</Text>
            <View style={S.quickGrid}>
              {QUICK_QUESTIONS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={S.quickCard}
                  onPress={() => sendMessage(q)}
                  activeOpacity={0.75}
                >
                  <Text style={S.quickText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input area */}
        <View style={S.inputArea}>
          <View style={S.inputWrap}>
            <TextInput
              style={S.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
            />
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
          <Text style={S.inputHint}>SHIFT+ENTER FOR NEW LINE · ENTER TO SEND</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  // Header — dark navy like in screenshot
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#f43f5e',
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: '800', color: '#fff' },
  headerPowered: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  onlineBar: {
    height: 3, backgroundColor: '#1e293b',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 6 },
  onlineBarFill: { flex: 1, height: 1, backgroundColor: '#f43f5e', opacity: 0.4 },

  messageList: {
    padding: Spacing.md,
    paddingTop: 16,
  },

  msgRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginBottom: 14,
  },
  msgRowUser: { flexDirection: 'row-reverse' },

  botAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 2,
    borderWidth: 2, borderColor: '#f43f5e',
  },

  bubble: {
    maxWidth: '80%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4, marginLeft: 8,
  },
  bubbleBot: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  bubbleTextUser: { fontSize: FontSize.base, color: '#fff', lineHeight: 22 },
  bubbleTextBot: { fontSize: FontSize.base, color: C.text, lineHeight: 22 },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },

  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#f43f5e', opacity: 0.7,
  },

  // Quick questions — matching screenshot grid
  quickSection: {
    paddingHorizontal: Spacing.md, paddingBottom: 8,
    backgroundColor: C.background,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 12,
  },
  quickLabel: {
    fontSize: 10, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 0.8, marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  quickCard: {
    backgroundColor: C.card,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10,
    width: '47%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  quickText: { fontSize: FontSize.sm, fontWeight: '700', color: C.text, lineHeight: 20 },

  // Input area
  inputArea: {
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 8 : Spacing.md,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: C.background,
    borderRadius: 24, borderWidth: 2, borderColor: '#f43f5e',
    paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1, fontSize: FontSize.base, color: C.text,
    maxHeight: 100, paddingVertical: 4,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  inputHint: {
    fontSize: 9, fontWeight: '600', color: C.textMuted,
    textAlign: 'center', marginTop: 6, letterSpacing: 0.3,
  },
});
