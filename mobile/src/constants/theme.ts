export const Colors = {
  primary: '#2563eb',      // blue-600
  primaryDark: '#1d4ed8',  // blue-700
  primaryLight: '#dbeafe', // blue-100
  accent: '#f43f5e',       // rose-500
  accentDark: '#e11d48',   // rose-600
  amber: '#f59e0b',        // amber-400 (points)
  green: '#16a34a',        // green-600
  red: '#dc2626',          // red-600

  // Neutrals
  white: '#ffffff',
  black: '#0f172a',        // slate-900
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',

  // Semantic
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',

  // Status
  statusApplied: '#dbeafe',
  statusAppliedText: '#1d4ed8',
  statusPending: '#fef9c3',
  statusPendingText: '#854d0e',
  statusAccepted: '#dcfce7',
  statusAcceptedText: '#166534',
  statusRejected: '#fee2e2',
  statusRejectedText: '#991b1b',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
