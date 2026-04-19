import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Header } from '../components/layout/Header';
import { useTheme } from '../providers/ThemeProvider';
import { syncService } from '../services/syncService';
import { settingsService } from '../services/settingsService';
import { GoogleSpreadsheet, SyncConfig } from '../types/sync';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';

WebBrowser.maybeCompleteAuthSession();

type SetupMode = 'existing' | 'create';

type ExtraConfig = {
  googleAuth?: {
    iosClientId?: string;
    androidClientId?: string;
  };
};

export default function SyncSettings() {
  const { theme } = useTheme();
  const router = useRouter();

  const [config, setConfig] = useState<SyncConfig>(syncService.getGoogleSyncConfig());
  const [lastAutoSyncAt, setLastAutoSyncAt] = useState<string | null>(settingsService.getGoogleAutoSyncLastRunAt());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(settingsService.getGoogleAutoSyncEnabled());
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheet[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [selectedSpreadsheetName, setSelectedSpreadsheetName] = useState<string>('');
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [tabName, setTabName] = useState(syncService.getDefaultSheetName());
  const [setupMode, setSetupMode] = useState<SetupMode>('existing');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sheetPageTokens, setSheetPageTokens] = useState<string[]>(['']);
  const [sheetPageIndex, setSheetPageIndex] = useState(0);
  const [nextSheetPageToken, setNextSheetPageToken] = useState<string | undefined>(undefined);
  const [authRefreshing, setAuthRefreshing] = useState(false);
  const lastPromptAtRef = useRef(0);

  const extraConfig = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const isExpoGo = Constants.executionEnvironment === 'storeClient';

  const androidRedirectUri = useMemo(() => {
    const androidClientId = extraConfig.googleAuth?.androidClientId;
    if (!androidClientId) {
      return undefined;
    }

    const clientWithoutSuffix = androidClientId.replace('.apps.googleusercontent.com', '');
    return `com.googleusercontent.apps.${clientWithoutSuffix}:/oauthredirect`;
  }, [extraConfig.googleAuth?.androidClientId]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: extraConfig.googleAuth?.androidClientId || undefined,
    iosClientId: extraConfig.googleAuth?.iosClientId || undefined,
    redirectUri: Platform.OS === 'android' ? androidRedirectUri : undefined,
    scopes: [
      syncService.googleSheetsScope,
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'openid',
      'email',
      'profile',
    ],
  });

  useEffect(() => {
    syncService.getGoogleAccessToken().then((stored) => setToken(stored));

    if (config.spreadsheetId) {
      setSelectedSpreadsheetId(config.spreadsheetId);
    }
    if (config.spreadsheetName) {
      setSelectedSpreadsheetName(config.spreadsheetName);
    }
    if (config.sheetName) {
      setTabName(config.sheetName);
    }
  }, [config.sheetName, config.spreadsheetId, config.spreadsheetName]);

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'error') {
      const messageFromAuthSession =
        (response as unknown as { error?: { message?: string } }).error?.message ??
        'Google rejected the OAuth request. Check OAuth client config, package name, SHA-1, and that this is not Expo Go.';
      Alert.alert('Google sign-in failed', messageFromAuthSession);
      return;
    }

    if (response.type !== 'success') {
      return;
    }

    const accessToken = response.authentication?.accessToken;
    if (!accessToken) {
      Alert.alert('Sign-in failed', 'No access token was returned by Google.');
      return;
    }

    const issuedAt = response.authentication?.issuedAt;
    const expiresIn = response.authentication?.expiresIn;
    const expiresAt = issuedAt != null && expiresIn != null ? issuedAt + expiresIn : undefined;

    syncService
      .setGoogleAccessToken(accessToken, expiresAt)
      .then(async () => {
        const profile = await syncService.fetchGoogleUserProfile(accessToken);
        syncService.setGoogleAccountProfile(profile);
        setToken(accessToken);
        Alert.alert('Connected', 'Google account connected successfully.');
      })
      .catch((error) => {
        Alert.alert(
          'Google sign-in failed',
          error instanceof Error ? error.message : 'Failed to store Google session/profile securely.',
        );
      });
  }, [response]);

  const loadSpreadsheetPage = useCallback(
    async (pageToken?: string) => {
      if (!token) {
        Alert.alert('Sign in required', 'Connect Google first to load spreadsheets.');
        return false;
      }

      setLoadingSheets(true);
      try {
        const next = await syncService.listSpreadsheets(token, pageToken);
        setSpreadsheets(next.items);
        setNextSheetPageToken(next.nextPageToken);
        if (next.items.length === 0) {
          Alert.alert('No sheets found', 'No spreadsheets were found in this account for this page.');
        }
        return true;
      } catch (error) {
        Alert.alert('Load failed', error instanceof Error ? error.message : 'Could not load spreadsheets.');
        return false;
      } finally {
        setLoadingSheets(false);
      }
    },
    [token],
  );

  const maybePromptForReauth = useCallback(async () => {
    if (!isNative || isExpoGo || !request) {
      return;
    }

    if (authRefreshing) {
      return;
    }

    const now = Date.now();
    if (now - lastPromptAtRef.current < 10 * 60 * 1000) {
      return;
    }

    const storedToken = await syncService.getGoogleAccessToken();
    setToken(storedToken);

    if (storedToken || !config.spreadsheetId || !config.sheetName) {
      return;
    }

    setAuthRefreshing(true);
    lastPromptAtRef.current = now;
    try {
      await promptAsync();
    } finally {
      setAuthRefreshing(false);
    }
  }, [authRefreshing, config.sheetName, config.spreadsheetId, isExpoGo, isNative, promptAsync, request]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void maybePromptForReauth();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [maybePromptForReauth]);

  const refreshConfig = () => {
    setConfig(syncService.getGoogleSyncConfig());
    setLastAutoSyncAt(settingsService.getGoogleAutoSyncLastRunAt());
    setAutoSyncEnabled(settingsService.getGoogleAutoSyncEnabled());
  };

  const handleConnectGoogle = async () => {
    if (!isNative) {
      Alert.alert('Not supported', 'Google sync sign-in is currently available on Android and iOS only.');
      return;
    }

    if (isExpoGo) {
      Alert.alert(
        'Use a build, not Expo Go',
        'Google OAuth cannot run from Expo Go because redirect_uri becomes exp://... . Install a preview/development build and try again.',
      );
      return;
    }

    if (Platform.OS === 'android' && !extraConfig.googleAuth?.androidClientId) {
      Alert.alert('Missing OAuth configuration', 'Missing extra.googleAuth.androidClientId in app.json.');
      return;
    }

    if (Platform.OS === 'ios' && !extraConfig.googleAuth?.iosClientId) {
      Alert.alert('Missing OAuth configuration', 'Missing extra.googleAuth.iosClientId in app.json.');
      return;
    }

    if (!request) {
      Alert.alert('Initializing', 'Google sign-in is still initializing. Try again in a moment.');
      return;
    }

    await promptAsync();
  };

  const handleSignOut = async () => {
    await syncService.clearGoogleSession();
    setToken(null);
    setSpreadsheets([]);
    setSelectedSpreadsheetId('');
    setSelectedSpreadsheetName('');
    refreshConfig();
  };

  const handleLoadSpreadsheets = async () => {
    const ok = await loadSpreadsheetPage();
    if (!ok) {
      return;
    }

    setSheetPageTokens(['']);
    setSheetPageIndex(0);
  };

  const handleNextSheetsPage = async () => {
    if (!nextSheetPageToken) {
      return;
    }

    const ok = await loadSpreadsheetPage(nextSheetPageToken);
    if (!ok) {
      return;
    }

    setSheetPageTokens((prev) => [...prev.slice(0, sheetPageIndex + 1), nextSheetPageToken]);
    setSheetPageIndex((prev) => prev + 1);
  };

  const handlePreviousSheetsPage = async () => {
    if (sheetPageIndex <= 0) {
      return;
    }

    const previousToken = sheetPageTokens[sheetPageIndex - 1] || undefined;
    const ok = await loadSpreadsheetPage(previousToken);
    if (!ok) {
      return;
    }

    setSheetPageIndex((prev) => prev - 1);
  };

  const handleSaveSheetConfig = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Connect Google first to configure sync.');
      return;
    }

    const preferredTab = tabName.trim() || syncService.getDefaultSheetName();

    setSavingConfig(true);
    try {
      let spreadsheetId = selectedSpreadsheetId;
      let spreadsheetName = selectedSpreadsheetName;

      if (setupMode === 'create') {
        const title = newSpreadsheetName.trim();
        if (!title) {
          Alert.alert('Name required', 'Enter a spreadsheet name to create one.');
          return;
        }

        const created = await syncService.createSpreadsheet(token, title);
        spreadsheetId = created.id;
        spreadsheetName = created.name;
      } else if (!spreadsheetId || !spreadsheetName) {
        Alert.alert('Spreadsheet required', 'Select an existing spreadsheet.');
        return;
      }

      const appTab = await syncService.ensureAppSheetTab(token, spreadsheetId, preferredTab);

      syncService.saveGoogleSheetSelection({
        spreadsheetId,
        spreadsheetName,
        sheetName: appTab,
      });

      refreshConfig();
      setSelectedSpreadsheetId(spreadsheetId);
      setSelectedSpreadsheetName(spreadsheetName);
      setTabName(appTab);
      Alert.alert('Saved', `Sync target configured: ${spreadsheetName} / ${appTab}`);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save sync configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    if (enabled && (!config.spreadsheetId || !config.sheetName)) {
      Alert.alert('Configuration required', 'Configure your target spreadsheet before enabling auto-sync.');
      return;
    }
    settingsService.setGoogleAutoSyncEnabled(enabled);
    refreshConfig();
  };

  const handleSyncNow = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Connect Google before syncing.');
      return;
    }

    if (!config.spreadsheetId || !config.sheetName) {
      Alert.alert('Configuration required', 'Set the sync target first.');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncService.syncTransactionsToGoogleSheet(token);
      refreshConfig();
      Alert.alert('Sync complete', `Pushed ${result.rowsPushed} transaction rows.`);
    } catch (error) {
      refreshConfig();
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Could not sync transactions.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="Google Sheets Sync" showBackButton onBackPress={() => router.back()} />

        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}> 
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Connection</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Sign in with Google to configure and sync your transaction data.</Text>

          {token ? (
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.outlineVariant }]} onPress={handleSignOut}>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.onSurfaceVariant }]}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleConnectGoogle}>
              <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>Sign In With Google</Text>
            </TouchableOpacity>
          )}

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>Auto Sync at 2:00 AM</Text>
              <Text style={[styles.switchSubtitle, { color: theme.colors.onSurfaceVariant }]}>Turn off if you only want manual sync.</Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primary }}
              thumbColor={theme.colors.onPrimary}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}> 
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Sheet Configuration</Text>

          <ToggleButtonGroup
            options={[
              { label: 'Select Existing', value: 'existing' as const },
              { label: 'Create New', value: 'create' as const },
            ]}
            selected={setupMode}
            onSelect={setSetupMode}
            activeColor={theme.colors.primary}
            activeTextColor={theme.colors.onPrimary}
            inactiveTextColor={theme.colors.onSurfaceVariant}
            borderColor={theme.colors.outlineVariant}
          />

          {setupMode === 'existing' ? (
            <>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.colors.outlineVariant }]}
                onPress={handleLoadSpreadsheets}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.onSurfaceVariant }]}>
                  {loadingSheets ? 'Loading...' : 'Load Spreadsheets'}
                </Text>
              </TouchableOpacity>

              {spreadsheets.map((sheet) => (
                <TouchableOpacity
                  key={sheet.id}
                  style={[
                    styles.sheetOption,
                    {
                      borderColor: selectedSpreadsheetId === sheet.id ? theme.colors.primary : theme.colors.outlineVariant,
                      backgroundColor:
                        selectedSpreadsheetId === sheet.id ? theme.colors.primaryContainer : theme.colors.surfaceContainerHigh,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSpreadsheetId(sheet.id);
                    setSelectedSpreadsheetName(sheet.name);
                  }}
                >
                  <Text style={[styles.sheetOptionText, { color: theme.colors.onSurface }]}>{sheet.name}</Text>
                </TouchableOpacity>
              ))}

              {spreadsheets.length > 0 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      styles.paginationButton,
                      { borderColor: theme.colors.outlineVariant },
                    ]}
                    onPress={handlePreviousSheetsPage}
                    disabled={sheetPageIndex === 0 || loadingSheets}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.onSurfaceVariant }]}>Previous</Text>
                  </TouchableOpacity>

                  <Text style={[styles.pageText, { color: theme.colors.onSurfaceVariant }]}>Page {sheetPageIndex + 1}</Text>

                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      styles.paginationButton,
                      { borderColor: theme.colors.outlineVariant },
                    ]}
                    onPress={handleNextSheetsPage}
                    disabled={!nextSheetPageToken || loadingSheets}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.onSurfaceVariant }]}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>New Spreadsheet Name</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant }]}
                placeholder="Personal Budget Ledger"
                placeholderTextColor={theme.colors.outline}
                value={newSpreadsheetName}
                onChangeText={setNewSpreadsheetName}
              />
            </>
          )}

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>App Tab Name</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant }]}
            placeholder={syncService.getDefaultSheetName()}
            placeholderTextColor={theme.colors.outline}
            value={tabName}
            onChangeText={setTabName}
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSaveSheetConfig}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
              {savingConfig ? 'Saving...' : 'Save Sync Configuration'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>Configured target: {config.spreadsheetName ?? 'Not set'} / {config.sheetName ?? 'Not set'}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}> 
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Manual Sync</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Push local transactions to the configured Google Sheet tab.</Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: syncing ? theme.colors.surfaceContainerHigh : theme.colors.primary }]}
            onPress={handleSyncNow}
            disabled={syncing}
          >
            <Text style={[styles.primaryButtonText, { color: syncing ? theme.colors.onSurfaceVariant : theme.colors.onPrimary }]}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>

          <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>Status: {config.status}</Text>
          <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>Last sync: {config.lastSync ?? 'Never'}</Text>
          <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>Last auto-sync: {lastAutoSyncAt ?? 'Never'}</Text>
          {!!config.lastError && (
            <Text style={[styles.statusText, { color: theme.colors.secondary }]}>Last error: {config.lastError}</Text>
          )}
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
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchCopy: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },

  sheetOption: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sheetOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  paginationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paginationButton: {
    flex: 1,
    minHeight: 40,
  },
  pageText: {
    minWidth: 70,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
