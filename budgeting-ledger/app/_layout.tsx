import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from "../providers/ThemeProvider";
import { AppState, Platform } from "react-native";
import { useEffect } from 'react';
import { autoSyncService } from '../services/autoSyncService';

// Initialize database only on native platforms
if (Platform.OS !== 'web') {
  import("../database/schema").then(({ initDatabase }) => {
    initDatabase();
  });
}

function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      {children}
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.surface },
      }}
    />
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    autoSyncService.registerBackgroundAutoSync().catch(() => {
      // Best-effort registration; foreground catch-up still runs on app active.
    });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        autoSyncService.handleAppBecameActive().catch(() => {
          // Avoid crashing on transient background/task errors.
        });
      }
    });

    autoSyncService.handleAppBecameActive().catch(() => {
      // Ignore startup check failures.
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <ThemedRoot>
        <ThemedStack />
      </ThemedRoot>
    </ThemeProvider>
  );
}
