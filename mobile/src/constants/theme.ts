// ─── Light Palette (matches website exactly) ───────────────────────────────

export const Colors = {
  primary: '#f43f5e',       // rose-500 — main brand color
  primaryDark: '#e11d48',   // rose-600
  primaryLight: '#ffe4e6',  // rose-100
  accent: '#2563eb',        // blue-600
  accentDark: '#1d4ed8',    // blue-700
  accentLight: '#eff6ff',   // blue-50
  amber: '#f59e0b',         // vibrant-yellow — website uses this for badges/filters
  amberLight: '#fffbeb',    // amber-50
  green: '#16a34a',
  greenLight: '#dcfce7',
  red: '#dc2626',
  purple: '#7c3aed',
  cyan: '#0891b2',

  white: '#ffffff',
  black: '#0f172a',         // slate-900 — used for borders, shadows, text
  navy: '#0f172a',          // explicit navy alias
  navyBorder: '#0f172a',    // thick 2-3px borders on cards (neo-brutalist style)
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

  background: '#ffffff',    // website is white background
  cardBg: '#ffffff',
  card: '#ffffff',
  border: '#e2e8f0',        // light borders between items
  cardBorder: '#0f172a',    // neo-brutalist thick card borders
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',

  // Website shadow style: thick offset solid shadow
  shadowColor: '#0f172a',

  statusApplied: '#dbeafe',
  statusAppliedText: '#1d4ed8',
  statusPending: '#fef9c3',
  statusPendingText: '#854d0e',
  statusAccepted: '#dcfce7',
  statusAcceptedText: '#166534',
  statusRejected: '#fee2e2',
  statusRejectedText: '#991b1b',
};

// ─── Dark Palette (matches website dark mode) ────────────────────────────────

export const DarkColors: typeof Colors = {
  primary: '#f43f5e',
  primaryDark: '#e11d48',
  primaryLight: '#4c0519',
  accent: '#3b82f6',
  accentDark: '#2563eb',
  accentLight: '#1e3a5f',
  amber: '#f59e0b',
  amberLight: '#451a03',
  green: '#22c55e',
  greenLight: '#14532d',
  red: '#ef4444',
  purple: '#a78bfa',
  cyan: '#22d3ee',

  white: '#0f172a',       // dark mode "white" = slate-900
  black: '#f8fafc',
  navy: '#f8fafc',
  navyBorder: '#f8fafc',  // borders are light in dark mode
  gray50: '#1e293b',
  gray100: '#334155',
  gray200: '#475569',
  gray300: '#64748b',
  gray400: '#94a3b8',
  gray500: '#94a3b8',
  gray600: '#cbd5e1',
  gray700: '#e2e8f0',
  gray800: '#f1f5f9',
  gray900: '#f8fafc',

  background: '#020617',   // slate-950
  cardBg: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  cardBorder: '#f8fafc',  // light borders in dark mode
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  shadowColor: '#000000',

  statusApplied: '#1e3a5f',
  statusAppliedText: '#93c5fd',
  statusPending: '#451a03',
  statusPendingText: '#fcd34d',
  statusAccepted: '#14532d',
  statusAcceptedText: '#86efac',
  statusRejected: '#450a0a',
  statusRejectedText: '#fca5a5',
};

// ─── Dimensions ──────────────────────────────────────────────────────────────

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
  // Website neo-brutalist offset shadow
  brutal: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
};
