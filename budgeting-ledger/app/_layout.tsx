import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from "../providers/ThemeProvider";
import { Platform } from "react-native";

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
  return (
    <ThemeProvider>
      <ThemedRoot>
        <ThemedStack />
      </ThemedRoot>
    </ThemeProvider>
  );
}
