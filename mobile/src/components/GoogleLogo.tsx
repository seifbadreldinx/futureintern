import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  size?: number;
}

// Reliable CDN URL for the Google G Logo
const GOOGLE_G_URL = 'https://img.icons8.com/color/48/000000/google-logo.png';

export default function GoogleLogo({ size = 22 }: Props) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Ionicons name="logo-google" size={size * 0.8} color="#4285F4" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: GOOGLE_G_URL }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
  },
});
