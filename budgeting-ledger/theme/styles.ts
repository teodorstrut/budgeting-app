// Design System Stylesheet for Budgeting App
// Based on "mint_honey_night" theme: Luminous Depth & Clarity (dark) and The Organic Editorial (light)

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { Theme } from '../types/theme';
import { useTheme } from '../providers/ThemeProvider';

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

// Typography (Assuming Plus Jakarta Sans is loaded)
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

// Create theme objects
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

// For backward compatibility, default to dark
export const colors = colorSchemes.dark;

// Shadows (Tonal Layering, but for RN, use elevation or shadow props)
export const shadows = {
  ambient: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 4,
  },
};

// Gradients (For CTAs, use react-native-linear-gradient if needed)
export const gradients = {
  primaryCta: {
    colors: [colors.primaryContainer, colors.primary],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Component Styles
export const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  section: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.default,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  floatingCard: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    ...shadows.ambient,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: colors.onPrimary,
    ...typography.labelMd,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonSecondaryText: {
    color: colors.primary,
    ...typography.labelMd,
  },
  buttonTertiary: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTertiaryText: {
    color: colors.secondary,
    ...typography.labelMd,
  },

  // Inputs
  inputContainer: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.default,
    padding: spacing.sm,
  },
  input: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  inputLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  inputFocus: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Chips
  chip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    margin: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },

  // Text Styles
  textDisplayLg: typography.displayLg,
  textHeadlineMd: typography.headlineMd,
  textBodyMd: typography.bodyMd,
  textOnSurfaceVariant: {
    color: colors.onSurfaceVariant,
  },

  // Layout Helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── useSharedStyles ──────────────────────────────────────────────────────────
// Theme-aware shared styles hook. Use this instead of the static `styles` export.
//
// Usage:
//   const shared = useSharedStyles();
//   <View style={shared.containers.flex1}>
//

export function useSharedStyles() {
  const { theme } = useTheme();
  const c = theme.colors;

  return useMemo(() => ({
    // ── Containers ────────────────────────────────────────────────────────────
    containers: StyleSheet.create({
      flex1: { flex: 1 },
      scrollContent: { padding: 16 },
      row: { flexDirection: 'row', alignItems: 'center' },
      rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
      center: { alignItems: 'center', justifyContent: 'center' },
    }),

    // ── Typography ────────────────────────────────────────────────────────────
    text: StyleSheet.create({
      screenTitle: { fontSize: 22, fontWeight: '800' as const },
      sectionTitle: { fontSize: 20, fontWeight: '700' as const },
      strongBody: { fontSize: 15, fontWeight: '700' as const },
      bodyMd: { fontSize: 16 },
      labelMd: { fontSize: 14, fontWeight: '600' as const },
      labelSm: { fontSize: 13, lineHeight: 18 },
      labelXs: { fontSize: 12 },
      uppercaseLabel: {
        fontSize: 11,
        fontWeight: '700' as const,
        letterSpacing: 1.2,
        textTransform: 'uppercase' as const,
      },
    }),

    // ── Cards ─────────────────────────────────────────────────────────────────
    card: StyleSheet.create({
      base: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        gap: 10,
        backgroundColor: c.surfaceContainerLow,
        borderColor: c.outlineVariant,
      },
      section: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        gap: 12,
        backgroundColor: c.surfaceContainerLow,
        borderColor: c.outlineVariant,
      },
    }),

    // ── Buttons ───────────────────────────────────────────────────────────────
    buttons: StyleSheet.create({
      primary: {
        backgroundColor: c.primary,
        borderRadius: 12,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      },
      primaryText: { fontSize: 14, fontWeight: '700' as const, color: c.onPrimary },
      secondary: {
        borderWidth: 1,
        borderColor: c.outlineVariant,
        borderRadius: 12,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
      },
      secondaryText: { fontSize: 14, fontWeight: '600' as const, color: c.primary },
      pill: {
        borderRadius: 9999,
        paddingHorizontal: 16,
        paddingVertical: 8,
      },
      iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),

    // ── Inputs ────────────────────────────────────────────────────────────────
    inputs: StyleSheet.create({
      base: {
        height: 48,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        marginTop: 8,
        backgroundColor: c.surfaceContainerLow,
        borderColor: c.outlineVariant,
      },
      label: {
        fontSize: 12,
        fontWeight: '600' as const,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
        color: c.onSurfaceVariant,
      },
    }),

    // ── Modal / Bottom Sheet ──────────────────────────────────────────────────
    modal: StyleSheet.create({
      backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%' as unknown as number,
        backgroundColor: c.surfaceContainerLow,
      },
      sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      },
      sheetTitle: { fontSize: 18, fontWeight: '700' as const, color: c.onSurface ?? c.onSurfaceVariant },
    }),

    // ── Progress Bar ──────────────────────────────────────────────────────────
    progress: StyleSheet.create({
      track: {
        borderRadius: 9999,
        overflow: 'hidden' as const,
      },
      fill: {
        height: '100%' as unknown as number,
        borderRadius: 9999,
      },
    }),

    // ── Empty State ───────────────────────────────────────────────────────────
    emptyState: StyleSheet.create({
      container: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 6,
      },
      title: { fontSize: 15, fontWeight: '600' as const, color: c.onSurface ?? c.onSurfaceVariant },
      subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16, color: c.onSurfaceVariant },
    }),
  }), [c]);
}