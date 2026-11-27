import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from "../providers/ThemeProvider";
import { AppState, Platform, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from 'react';
import { autoSyncService } from '../services/autoSyncService';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible until the DB is ready.
SplashScreen.preventAutoHideAsync();

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
  const [dbReady, setDbReady] = useState(Platform.OS === 'web');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const initDb = async () => {
      const { initDbConnection } = await import('../database/connection');
      await initDbConnection();
      const { initDatabase } = await import('../database/schema');
      initDatabase();
    };

    initDb()
      .then(() => {
        setDbReady(true);
      })
      .catch((e) => {
        // DB failed to open entirely — this is unrecoverable.
        // setDbReady stays false so screens never render with a null DB.
        console.error('[DB] Fatal init error:', e);
        setDbError(e instanceof Error ? `${e.name}: ${e.message}\n\n${e.stack ?? ''}` : String(e));
      })
      .finally(() => {
        SplashScreen.hideAsync();
      });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !dbReady) {
      return;
    }

    autoSyncService.registerBackgroundAutoSync().catch(() => {});

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        autoSyncService.handleAppBecameActive().catch(() => {});
      }
    });

    autoSyncService.handleAppBecameActive().catch(() => {});

    return () => {
      sub.remove();
    };
  }, [dbReady]);

  if (dbError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 48 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#b00020' }}>
            Database failed to open
          </Text>
          <Text selectable style={{ fontSize: 12, color: '#000' }}>
            {dbError}
          </Text>
        </ScrollView>
      </View>
    );
  }

  if (!dbReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <ThemedRoot>
        <ThemedStack />
      </ThemedRoot>
    </ThemeProvider>
  );
}
