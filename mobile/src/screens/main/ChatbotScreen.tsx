import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, FlatList, ActivityIndicator,
  SafeAreaView, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius } from '../../constants/theme';
import { getAuthToken } from '../../services/api';

const API_BASE = 'https://futureintern-production.up.railway.app/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "👋 Hi! I'm FutureIntern AI, your internship assistant. I can help you:\n\n• Find internships that match your skills\n• Tips on writing a great CV\n• Application advice & interview prep\n• Questions about companies\n\nWhat would you like to know?",
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  'Find me internships in AI',
  'How do I write a great CV?',
  'Interview preparation tips',
  'What companies are hiring?',
];

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const { C } = useTheme();
  const S = makeStyles(C);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    Keyboard.dismiss();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      let reply = '';
      if (response.ok) {
        const data = await response.json();
        reply = data.response || data.message || data.reply || data.answer || '';
      }

      if (!reply) {
        // Fallback responses
        const lower = content.toLowerCase();
        if (lower.includes('internship') || lower.includes('job')) {
          reply = "I can help you find internships! Go to the **Browse** tab to search through all available positions. You can filter by industry, location, and type. Would you like tips on what to look for?";
        } else if (lower.includes('cv') || lower.includes('resume')) {
          reply = "Great question! Here are CV tips:\n\n• Keep it to 1-2 pages\n• Tailor it to each role\n• Highlight relevant projects\n• Include measurable achievements\n• Use the CV Builder in your profile!\n\nNeed more specific advice?";
        } else if (lower.includes('interview')) {
          reply = "Interview prep tips:\n\n1. Research the company thoroughly\n2. Practice common questions (Tell me about yourself, Why this role?)\n3. Prepare 2-3 questions to ask\n4. Review your CV and be ready to expand on anything\n5. Send a thank-you email after!\n\nWant mock interview questions for a specific role?";
        } else if (lower.includes('company') || lower.includes('compan')) {
          reply = "Check out the **Companies** tab to browse all companies that post internships on FutureIntern. You can see their open positions, industry, and location. Which industry interests you most?";
        } else {
          reply = "I'm here to help with your internship journey! You can ask me about finding internships, CV writing, interview prep, or anything career-related. What's on your mind?";
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[S.msgWrap, isUser ? S.msgWrapUser : S.msgWrapBot]}>
        {!isUser && (
          <View style={S.botAvatar}>
            <Ionicons name="hardware-chip-outline" size={16} color="#f43f5e" />
          </View>
        )}
        <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleBot]}>
          <Text style={[S.bubbleText, isUser ? S.bubbleTextUser : S.bubbleTextBot]}>
            {item.content}
          </Text>
          <Text style={[S.timeText, { color: isUser ? 'rgba(255,255,255,0.6)' : C.textMuted }]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={S.safe}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerAvatarWrap}>
          <Ionicons name="hardware-chip-outline" size={20} color="#f43f5e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.headerTitle}>FutureIntern AI</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={S.onlineDot} />
            <Text style={S.headerSub}>Online · AI Internship Assistant</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMessages([WELCOME_MESSAGE])}
          style={{ padding: 4 }}
        >
          <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={S.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={S.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? (
            <View style={[S.msgWrap, S.msgWrapBot]}>
              <View style={S.botAvatar}>
                <Ionicons name="hardware-chip-outline" size={16} color="#f43f5e" />
              </View>
              <View style={[S.bubble, S.bubbleBot, { paddingHorizontal: 16, paddingVertical: 12 }]}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={[S.typingDot, { opacity: 0.4 + i * 0.2 }]} />
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        />

        {/* Quick prompts (only show when just welcome) */}
        {messages.length === 1 && (
          <View style={S.quickPromptsWrap}>
            <Text style={S.quickPromptsLabel}>Quick Questions</Text>
            <View style={S.quickPrompts}>
              {QUICK_PROMPTS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={S.quickPrompt}
                  onPress={() => sendMessage(p)}
                  activeOpacity={0.7}
                >
                  <Text style={S.quickPromptText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={S.inputBar}>
          <TextInput
            style={S.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about internships, CV tips..."
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[S.sendBtn, (!input.trim() || loading) && S.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.primary },
  flex: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: Spacing.md,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    flexDirection: 'row', alignItems: 'center',
  },
  headerAvatarWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },

  messageList: { padding: Spacing.md, paddingBottom: 8 },

  msgWrap: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgWrapUser: { justifyContent: 'flex-end' },
  msgWrapBot: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center',
    marginRight: 8, borderWidth: 1.5, borderColor: '#f43f5e',
  },

  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.primary, borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: C.card, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
  },
  bubbleText: { fontSize: FontSize.base, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: C.text },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.primary,
  },

  quickPromptsWrap: {
    paddingHorizontal: Spacing.md, paddingBottom: 8,
    backgroundColor: C.background,
  },
  quickPromptsLabel: { fontSize: FontSize.xs, fontWeight: '700', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickPrompt: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.card, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: C.primary,
  },
  quickPromptText: { fontSize: FontSize.xs, fontWeight: '700', color: C.primary },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: Spacing.md, paddingTop: 8,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, fontSize: FontSize.base, color: C.text,
    backgroundColor: C.background, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, borderColor: C.border,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
