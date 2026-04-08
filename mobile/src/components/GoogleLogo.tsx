/**
 * GoogleLogo — renders the official Google "G" logo.
 * Uses expo-image (bundled with Expo SDK 54) which supports remote PNG.
 * Falls back to a styled View representation if image fails.
 */
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

// Official Google G PNG from Google's own CDN (always available on devices with internet)
const GOOGLE_G_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/64px-Google_%22G%22_Logo.svg.png';

// Pure RN fallback — 4 coloured quadrants + white donut + blue crossbar
function FallbackG({ size }: { size: number }) {
  const r = size / 2;
  const inner = size * 0.6;
  const innerR = inner / 2;
  const armTop = size * 0.375;
  const armH = size * 0.25;

  return (
    <View style={{ width: size, height: size, position: 'relative', overflow: 'hidden', borderRadius: r }}>
      {/* Red — top-left */}
      <View style={[s.quad, { top: 0, left: 0, borderTopLeftRadius: r, backgroundColor: '#EA4335' }]} />
      {/* Blue — top-right */}
      <View style={[s.quad, { top: 0, right: 0, borderTopRightRadius: r, backgroundColor: '#4285F4' }]} />
      {/* Yellow — bottom-left */}
      <View style={[s.quad, { bottom: 0, left: 0, borderBottomLeftRadius: r, backgroundColor: '#FBBC05' }]} />
      {/* Green — bottom-right */}
      <View style={[s.quad, { bottom: 0, right: 0, borderBottomRightRadius: r, backgroundColor: '#34A853' }]} />
      {/* White donut center */}
      <View style={{
        position: 'absolute',
        top: (size - inner) / 2, left: (size - inner) / 2,
        width: inner, height: inner, borderRadius: innerR,
        backgroundColor: '#fff',
      }} />
      {/* Blue G crossbar (right extension) */}
      <View style={{
        position: 'absolute',
        top: armTop, left: r, right: 0,
        height: armH, backgroundColor: '#4285F4',
      }} />
      {/* White mask — creates the open notch inside the G arm */}
      <View style={{
        position: 'absolute',
        top: armTop, left: r,
        right: size * 0.06, height: armH,
        backgroundColor: '#fff',
      }} />
    </View>
  );
}

const s = StyleSheet.create({
  quad: { position: 'absolute', width: '50%', height: '50%' },
});

export default function GoogleLogo({ size = 22 }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) return <FallbackG size={size} />;

  return (
    <Image
      source={{ uri: GOOGLE_G_URL }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}
