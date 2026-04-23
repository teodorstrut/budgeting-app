import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { resetAndReseed } from '../database/schema';
import { settingsService } from '../services/settingsService';
import { syncService } from '../services/syncService';
import { MonthStartDayPicker } from '../components/ui/MonthStartDayPicker';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';
import { confirmDialog } from '../utils/confirmDialog';

export default function Settings() {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const router = useRouter();
  const [resetDone, setResetDone] = useState(false);
  const [monthStartDay, setMonthStartDay] = useState(1);

  useEffect(() => {
    // Load the monthStartDay setting
    const day = settingsService.getMonthStartDay();
    setMonthStartDay(day);
  }, []);

  const handleReset = () => {
    confirmDialog(
      'Reset all data',
      'This action is not reversible. By using this button you will erase all of your financial data.',
      () => {
        syncService.clearGoogleSession().catch(() => {}).finally(() => {
          try {
            resetAndReseed();
            setResetDone(true);
          } catch (error) {
            Alert.alert('Reset failed', error instanceof Error ? error.message : 'An unexpected error occurred.');
          }
        });
      },
      'Reset',
    );
  };

  const handleMonthStartDayChange = (day: number) => {
    setMonthStartDay(day);
    settingsService.setMonthStartDay(day);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header
          title="Settings"
          showBackButton
          onBackPress={() => router.back()}
        />

        <View style={styles.content}>
          <Text style={[styles.pageTitle, { color: theme.colors.onSurface }]}>Settings</Text>
          <Text style={[styles.pageSubtitle, { color: theme.colors.onSurfaceVariant }]}>Configure your workspace and financial flow.</Text>

          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Preferences</Text>

            <View style={styles.preferenceRow}>
              <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>Appearance</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>Switch between visual modes</Text>
            </View>
            <View style={styles.preferenceRow}>
              <ToggleButtonGroup
                options={[
                  { label: 'Dark', value: 'dark' as const },
                  { label: 'Light', value: 'light' as const },
                ]}
                selected={colorScheme}
                onSelect={setColorScheme}
                activeColor={theme.colors.primary}
                activeTextColor={theme.colors.onPrimary}
                inactiveTextColor={theme.colors.onSurfaceVariant}
                borderColor={theme.colors.outline}
              />
            </View>

            <MonthStartDayPicker
              value={monthStartDay}
              onChange={handleMonthStartDayChange}
              theme={theme}
            />

            <TouchableOpacity
              style={[styles.linkButton, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerHigh }]}
              onPress={() => router.push('/manage-categories')}
              activeOpacity={0.8}
            >
              <View>
                <Text style={[styles.linkTitle, { color: theme.colors.onSurface }]}>Manage Categories</Text>
                <Text style={[styles.linkSubtitle, { color: theme.colors.onSurfaceVariant }]}>Create, edit, and remove categories</Text>
              </View>
              <Text style={[styles.linkChevron, { color: theme.colors.primary }]}>›</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Cloud Sync</Text>
            <Text style={[styles.hint, { color: theme.colors.outline }]}>Sync with Google Sheets on Android and iOS.</Text>

            <TouchableOpacity
              style={[styles.linkButton, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerHigh }]}
              onPress={() => router.push('/sync-settings')}
              activeOpacity={0.8}
            >
              <View>
                <Text style={[styles.linkTitle, { color: theme.colors.onSurface }]}>Google Sheets Sync</Text>
                <Text style={[styles.linkSubtitle, { color: theme.colors.onSurfaceVariant }]}>Connect account and configure target sheet</Text>
              </View>
              <Text style={[styles.linkChevron, { color: theme.colors.primary }]}>›</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Danger Zone</Text>

            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Text style={[styles.resetButtonText, { color: theme.colors.onSecondary ?? '#fff' }]}>
                Reset all data
              </Text>
            </TouchableOpacity>

            {resetDone && (
              <Text style={[styles.successText, { color: theme.colors.primary }]}>
                Database reset successfully.
              </Text>
            )}

            <Text style={[styles.hint, { color: theme.colors.outline }]}>
              This action is not reversible. By using this button you will erase all of your financial data.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  content: {
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
  sectionCard: { padding: 20, gap: 12 },
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
  linkButton: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  linkChevron: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
});
