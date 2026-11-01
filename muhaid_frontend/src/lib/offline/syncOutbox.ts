import { inspectionsApi, inspectionsKeys } from '../../api/web/inspectionsApi';
import type { OutboxRecord } from '../../types/web/inspections';
import { toApiError } from '../apiError';
import { getToken } from '../authToken';
import { queryClient } from '../queryClient';
import { buildFormData } from './buildFormData';
import { outboxDb } from './outboxDb';

export interface SyncResult {
  sent: number;
  /** Entries the server refused during this run: retrying won't help until they change. */
  failed: OutboxRecord[];
  /** Stopped early on the network, the server or the session: trying again now won't help. */
  stopped: boolean;
}

type SyncListener = (result: SyncResult) => void;

const listeners = new Set<SyncListener>();
const LOCK_NAME = 'muhaid-outbox-sync';

/** Whoever triggered the sync, the app hears how it went. */
export function onSyncResult(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function run(inspectorId: string): Promise<SyncResult> {
  const result: SyncResult = { sent: 0, failed: [], stopped: false };

  // Left behind if the app closed mid-send. Offline, it must read as waiting, not sending.
  await outboxDb.outbox
    .where({ inspectorId, status: 'syncing' })
    .modify({ status: 'pending' });

  if (!navigator.onLine || !getToken()) return result;

  // Oldest first: the thing that has waited longest syncs first.
  const records = await outboxDb.outbox
    .where({ inspectorId, status: 'pending' })
    .sortBy('filledAt');

  // One at a time, so a large batch doesn't saturate a weak connection.
  for (const { id } of records) {
    // Read it again: it may have been discarded or corrected since this run began.
    const record = await outboxDb.outbox.get(id);
    if (record?.status !== 'pending') continue;
    await outboxDb.outbox.update(record.id, { status: 'syncing' });
    try {
      const { inspection } = await inspectionsApi.submit(buildFormData(record));
      // 201 or 200: the server has it. Only now is it safe to delete.
      await outboxDb.outbox.delete(record.id);
      queryClient.setQueryData(
        inspectionsKeys.detail(inspection.id),
        inspection,
      );
      result.sent += 1;
    } catch (err) {
      const error = toApiError(err);
      if (error.isRetryable) {
        await outboxDb.outbox.update(record.id, {
          status: 'pending',
          attempts: record.attempts + 1,
        });
        result.stopped = true;
        break; // offline or server down: stop and wait for the next trigger
      }
      if (error.status === 401) {
        await outboxDb.outbox.update(record.id, { status: 'pending' });
        result.stopped = true;
        break; // the client sends the user to log in; this resumes afterwards
      }
      const lastError = {
        status: error.status,
        messages: error.messages,
        body: error.body,
      };
      await outboxDb.outbox.update(record.id, { status: 'failed', lastError });
      result.failed.push({ ...record, status: 'failed', lastError });
    }
  }
  return result;
}

let running = false;
/** A trigger arrived mid-run, e.g. a save the run's list doesn't include. */
let runAgain = false;

/**
 * Sends this inspector's waiting entries, reusing each one's id so retries are safe. Only
 * one sync runs at a time, across tabs too: two tabs racing to store the same new id could
 * make the loser's request fail and mark good work as refused.
 */
export async function syncOutbox(inspectorId: string): Promise<void> {
  if (running) {
    runAgain = true;
    return;
  }
  running = true;
  let stopped = false;
  try {
    const result = navigator.locks
      ? await navigator.locks.request(
          LOCK_NAME,
          { ifAvailable: true },
          (lock) => (lock ? run(inspectorId) : null),
        )
      : await run(inspectorId);
    if (!result) return;
    stopped = result.stopped;
    if (result.sent > 0) {
      void queryClient.invalidateQueries({ queryKey: inspectionsKeys.all });
    }
    if (result.sent > 0 || result.failed.length > 0) {
      listeners.forEach((listener) => listener(result));
    }
  } finally {
    running = false;
    const again = runAgain && !stopped;
    runAgain = false;
    if (again) void syncOutbox(inspectorId);
  }
}
