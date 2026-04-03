import { Stack } from "expo-router";
import { ThemeProvider } from "./ThemeProvider";
import { initDatabase } from "../database/schema";

// Initialize database
initDatabase();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}
