/**
 * GoogleLogo — renders the official 4-color Google "G" logo
 * using pure React Native Views (no SVG dependency required).
 * 
 * Official Google brand colors:
 * Blue: #4285F4, Red: #EA4335, Yellow: #FBBC05, Green: #34A853
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

export default function GoogleLogo({ size = 22 }: Props) {
  const r = size / 2;
  const inner = size * 0.55;
  const innerR = inner / 2;
  const cutout = size * 0.38;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Four quadrant circles */}
      {/* Blue — top-right */}
      <View style={[styles.quad, { top: 0, right: 0, borderTopRightRadius: r, backgroundColor: '#4285F4' }]} />
      {/* Red — top-left */}
      <View style={[styles.quad, { top: 0, left: 0, borderTopLeftRadius: r, backgroundColor: '#EA4335' }]} />
      {/* Yellow — bottom-left */}
      <View style={[styles.quad, { bottom: 0, left: 0, borderBottomLeftRadius: r, backgroundColor: '#FBBC05' }]} />
      {/* Green — bottom-right */}
      <View style={[styles.quad, { bottom: 0, right: 0, borderBottomRightRadius: r, backgroundColor: '#34A853' }]} />

      {/* White circle cutout center */}
      <View style={[styles.center, {
        width: inner, height: inner, borderRadius: innerR,
        top: (size - inner) / 2, left: (size - inner) / 2,
      }]} />

      {/* Blue "G" arm — horizontal right extension */}
      <View style={{
        position: 'absolute',
        right: 0, top: size * 0.37,
        width: size * 0.5, height: size * 0.26,
        backgroundColor: '#4285F4',
      }} />
      {/* White mask over G arm inner part */}
      <View style={{
        position: 'absolute',
        right: size * 0.04, top: size * 0.37,
        width: size * 0.42, height: size * 0.26,
        backgroundColor: '#fff',
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  quad: {
    position: 'absolute',
    width: '50%', height: '50%',
  },
  center: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
});
