export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  surface: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceBright: string;
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  secondary: string;
  onSecondary?: string;
  secondaryContainer?: string;
  tertiary?: string;
  tertiaryContainer: string;
  onSurface?: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    displayLg: {
      fontFamily: string;
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
    };
    // Add more as needed
  };
}