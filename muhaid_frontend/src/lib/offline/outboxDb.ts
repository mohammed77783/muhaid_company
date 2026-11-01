import Dexie, { type Table } from 'dexie';

import type { OutboxRecord } from '../../types/web/inspections';

/**
 * Kept apart from the query cache, which can be cleared or rebuilt at any time: this is
 * the only copy of an inspector's work until the server answers 201 or 200. IndexedDB
 * stores Blobs natively, so the photo goes in as is.
 */
class OutboxDb extends Dexie {
  outbox!: Table<OutboxRecord, string>;

  constructor() {
    super('muhaid-inspector');
    this.version(1).stores({ outbox: 'id, inspectorId, [inspectorId+status]' });
  }
}

export const outboxDb = new OutboxDb();
