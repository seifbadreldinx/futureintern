import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const { C } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: C.gray100 }]}>
        <Ionicons name={icon} size={40} color={C.gray400} />
      </View>
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: C.textSecondary }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary }]} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  iconBox: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  btn: { paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.base },
});
