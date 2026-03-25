import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  fullscreen?: boolean;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ fullscreen = true, size = 'large' }: Props) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size={size} color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  fullscreen: { flex: 1, backgroundColor: Colors.background },
});
