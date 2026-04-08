/**
 * ChatbotFAB — floating AI chat button that works from any screen.
 * Uses root-level navigation to push to the Chatbot stack screen.
 */
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type AnyNavProp = NavigationProp<RootStackParamList>;

interface Props {
  /** Distance from bottom edge (default: 28) */
  bottom?: number;
  /** Distance from right edge (default: 20) */
  right?: number;
}

export default function ChatbotFAB({ bottom = 28, right = 20 }: Props) {
  // useNavigation might fail if called outside NavigationContainer — suppress
  let navigation: AnyNavProp | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigation = useNavigation<AnyNavProp>();
  } catch {
    return null;
  }

  const handlePress = () => {
    try {
      (navigation as any).navigate('Chatbot');
    } catch {
      // Auth screens live in a nested stack — try pushing to root
      try { (navigation as any).getParent()?.navigate('Chatbot'); } catch {}
    }
  };

  return (
    <TouchableOpacity
      style={[S.fab, { bottom, right }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <Ionicons name="hardware-chip-outline" size={22} color="#fff" />
      <View style={S.badge}>
        <Text style={S.badgeText}>AI</Text>
      </View>
    </TouchableOpacity>
  );
}

// Need Text for the badge
import { Text } from 'react-native';

const S = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#f43f5e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#f59e0b',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 8, fontWeight: '900',
    color: '#fff', letterSpacing: 0.2,
  },
});
