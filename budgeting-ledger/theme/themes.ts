// Pure theme data — no React or provider imports.
// ThemeProvider imports from here to avoid a require cycle with styles.ts.

import type { Theme } from '../types/theme';

// Color Palettes
export const colorSchemes = {
  dark: {
    // Surfaces
    surface: '#0d131f',
    surfaceContainerLow: '#161c27',
    surfaceContainer: '#1a202c',
    surfaceContainerHigh: '#242a36',
    surfaceContainerHighest: '#2f3542',
    surfaceBright: '#333946',

    // Primary
    primary: '#6feee1',
    primaryContainer: '#4fd1c5',
    onPrimary: '#003733',
    onSecondary: '#482900',

    // Secondary
    secondary: '#ffb866',

    // Tertiary
    tertiaryContainer: '#ffa2c5',

    // Variants
    onSurface: '#dde2f3',
    onSurfaceVariant: '#bbc9c7',
    outline: '#869491',
    outlineVariant: '#3c4947',
  },
  light: {
    // Surfaces
    surface: '#f6fafe',
    surfaceContainerLow: '#f0f4f8',
    surfaceContainer: '#ffffff',
    surfaceContainerHigh: '#e8f0f5',
    surfaceContainerHighest: '#d1e4ed',
    surfaceBright: '#c5d9e6',

    // Primary
    primary: '#006b5f',
    primaryContainer: '#16b8a6',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',

    // Secondary
    secondary: '#a43c12',
    secondaryContainer: '#fe7e4f',

    // Tertiary
    tertiary: '#705d00',
    tertiaryContainer: '#c1a200',

    // Variants
    onSurface: '#0f172a',
    onSurfaceVariant: '#3c4947',
    outline: '#bbcac6',
    outlineVariant: '#bbcac6',
  },
};

// Spacing Scale (based on 4px units)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography = {
  displayLg: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.04,
  },
  displayMd: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: -0.04,
  },
  displaySm: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.04,
  },
  headlineMd: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  titleLg: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  labelMd: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
};

// Border Radius
export const borderRadius = {
  default: 16,
  full: 9999,
};

// Theme objects consumed by ThemeProvider
export const themes: Record<'light' | 'dark', Theme> = {
  dark: {
    colors: colorSchemes.dark,
    spacing,
    typography,
  },
  light: {
    colors: colorSchemes.light,
    spacing,
    typography,
  },
};
