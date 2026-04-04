import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { Header } from '../components/layout/Header';
import { resetAndReseed } from '../database/schema';

export default function Settings() {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const router = useRouter();
  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    Alert.alert(
      'Reset Database',
      'This will delete all transactions and categories, then restore the default seed data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetAndReseed();
            setResetDone(true);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Header
        title="Settings"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.colors.onSurface }]}>Settings</Text>
        <Text style={[styles.pageSubtitle, { color: theme.colors.onSurfaceVariant }]}>Configure your workspace and financial flow.</Text>

        <View style={[styles.section, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Preferences</Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceCopy}>
              <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>Appearance</Text>
              <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>Switch between visual modes</Text>
            </View>

            <View style={[styles.toggleShell, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  colorScheme === 'dark' ? { backgroundColor: theme.colors.primary } : null,
                ]}
                onPress={() => setColorScheme('dark')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colorScheme === 'dark' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  colorScheme === 'light' ? { backgroundColor: theme.colors.primary } : null,
                ]}
                onPress={() => setColorScheme('light')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colorScheme === 'light' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Developer Tools</Text>

          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }]}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={[styles.resetButtonText, { color: theme.colors.onSecondary ?? '#fff' }]}>
              Reset &amp; Reseed Database
            </Text>
          </TouchableOpacity>

          {resetDone && (
            <Text style={[styles.successText, { color: theme.colors.primary }]}>
              Database reset successfully.
            </Text>
          )}

          <Text style={[styles.hint, { color: theme.colors.outline }]}>
            Clears all transactions and categories, then restores default seed data.
          </Text>
        </View>
      </View>
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
    paddingTop: 12,
    gap: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  preferenceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  toggleShell: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
  },
  toggleOption: {
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
