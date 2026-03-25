import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={40} color={Colors.gray400} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
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
    backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  btn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: 12, borderRadius: 10,
  },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
});
