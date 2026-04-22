import db from '../connection';

interface SyncDeletionRow {
  transactionId: number;
  deletedAt: string;
}

export const syncDeletionRepository = {
  recordTransactionDeletion: (transactionId: number, deletedAt: string): void => {
    db.runSync(
      `
      INSERT INTO sync_deletions (transactionId, deletedAt)
      VALUES (?, ?)
      ON CONFLICT(transactionId) DO UPDATE SET deletedAt = excluded.deletedAt
      `,
      [transactionId, deletedAt]
    );
  },

  getDeletedSince: (sinceIso: string): SyncDeletionRow[] => {
    const rows = db.getAllSync(
      'SELECT transactionId, deletedAt FROM sync_deletions WHERE deletedAt > ? ORDER BY deletedAt ASC',
      [sinceIso]
    );
    return rows as SyncDeletionRow[];
  },

  purgeOldTombstones: (olderThanDays: number): void => {
    const cutoffMs = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(cutoffMs).toISOString();
    db.runSync('DELETE FROM sync_deletions WHERE deletedAt < ?', [cutoff]);
  },
};
