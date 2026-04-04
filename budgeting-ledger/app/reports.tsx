import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';

export default function Reports() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}> 
      <View style={styles.content}>
        <Header
          title="Reports"
          showBackButton
          onBackPress={() => router.back()}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceContainerHigh,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Reports</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Coming soon.</Text>
        </View>
      </View>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
