import { useLiveQuery } from 'dexie-react-hooks';

import { outboxDb } from '../../lib/offline/outboxDb';
import type { OutboxRecord } from '../../types/web/inspections';

/**
 * This inspector's unsent work, oldest first and live. It is local data, so there is no
 * Suspense or TanStack Query here.
 */
export function useOutbox(inspectorId: string): OutboxRecord[] {
  return (
    useLiveQuery(
      () => outboxDb.outbox.where({ inspectorId }).sortBy('filledAt'),
      [inspectorId],
    ) ?? []
  );
}

/** How much is unsent, for the badge. Doesn't load the photos. */
export function useOutboxCount(inspectorId: string): number {
  return (
    useLiveQuery(
      () => outboxDb.outbox.where({ inspectorId }).count(),
      [inspectorId],
    ) ?? 0
  );
}

/** Templates with an unsent entry: each is a one-time job, so it must not be filled twice. */
export function useOutboxTemplateIds(inspectorId: string): Set<string> {
  const ids = useLiveQuery(async () => {
    const records = await outboxDb.outbox.where({ inspectorId }).toArray();
    return records.map((record) => record.templateId);
  }, [inspectorId]);
  return new Set(ids);
}

/**
 * One entry of this inspector's, or undefined while reading. Null means it isn't there:
 * sent, discarded, someone else's, or no id was given.
 */
export function useOutboxEntry(
  inspectorId: string,
  id: string | undefined,
): OutboxRecord | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    const record = await outboxDb.outbox.get(id);
    return record?.inspectorId === inspectorId ? record : null;
  }, [inspectorId, id]);
}
