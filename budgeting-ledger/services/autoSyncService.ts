import { Platform } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { settingsService } from './settingsService';
import { syncService } from './syncService';

const GOOGLE_AUTO_SYNC_TASK = 'budgeting-ledger-google-auto-sync';
const AUTO_SYNC_HOUR = 2;

const toLocalDayStamp = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const shouldRunAutoSyncNow = (): { shouldRun: boolean; localDay: string } => {
  const now = new Date();
  const localDay = toLocalDayStamp(now);
  const hasPassed2am = now.getHours() >= AUTO_SYNC_HOUR;
  const lastRunDay = settingsService.getGoogleAutoSyncLastLocalDay();
  return {
    shouldRun: hasPassed2am && lastRunDay !== localDay,
    localDay,
  };
};

export const autoSyncService = {
  getTaskName: (): string => GOOGLE_AUTO_SYNC_TASK,

  refreshGoogleConnectionState: async (): Promise<void> => {
    if (!settingsService.getGoogleSyncEnabled()) {
      return;
    }

    const token = await syncService.getGoogleAccessToken();
    if (!token) {
      settingsService.setGoogleLastError('Google session expired. Open Sync Settings to reconnect.');
      return;
    }

    try {
      const profile = await syncService.fetchGoogleUserProfile(token);
      await syncService.setGoogleAccountProfile(profile);
      settingsService.clearGoogleLastError();
    } catch {
      settingsService.setGoogleLastError('Google connection check failed. Open Sync Settings to reconnect.');
    }
  },

  runDueAutoSync: async (): Promise<boolean> => {
    if (!settingsService.getGoogleAutoSyncEnabled()) {
      return false;
    }

    const config = syncService.getGoogleSyncConfig();
    if (!config.spreadsheetId || !config.sheetName) {
      return false;
    }

    const { shouldRun, localDay } = shouldRunAutoSyncNow();
    if (!shouldRun) {
      return false;
    }

    const token = await syncService.getGoogleAccessToken();
    if (!token) {
      settingsService.setGoogleLastError('Google session expired before scheduled auto-sync.');
      return false;
    }

    await syncService.syncTransactionsToGoogleSheet(token);
    const nowIso = new Date().toISOString();
    settingsService.setGoogleAutoSyncLastLocalDay(localDay);
    settingsService.setGoogleAutoSyncLastRunAt(nowIso);
    return true;
  },

  registerBackgroundAutoSync: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return false;
    }

    const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(GOOGLE_AUTO_SYNC_TASK);
    if (alreadyRegistered) {
      return true;
    }

    await BackgroundTask.registerTaskAsync(GOOGLE_AUTO_SYNC_TASK, {
      minimumInterval: 15,
    });

    return true;
  },

  handleAppBecameActive: async (): Promise<void> => {
    await autoSyncService.refreshGoogleConnectionState();
    await autoSyncService.runDueAutoSync();
  },
};

if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(GOOGLE_AUTO_SYNC_TASK)) {
  TaskManager.defineTask(GOOGLE_AUTO_SYNC_TASK, async () => {
    try {
      const synced = await autoSyncService.runDueAutoSync();
      return synced
        ? BackgroundTask.BackgroundTaskResult.Success
        : BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}
