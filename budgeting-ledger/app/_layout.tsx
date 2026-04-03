import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from "./ThemeProvider";
import { Platform } from "react-native";

// Initialize database only on native platforms
if (Platform.OS !== 'web') {
  import("../database/schema").then(({ initDatabase }) => {
    initDatabase();
  });
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
