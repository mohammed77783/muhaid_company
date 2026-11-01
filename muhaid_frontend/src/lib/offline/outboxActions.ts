import type {
  DraftInput,
  OutboxError,
  OutboxRecord,
} from '../../types/web/inspections';
import type { Messages } from '../i18n/messages';
import { outboxDb } from './outboxDb';
import { syncOutbox } from './syncOutbox';

export type FailureKind =
  | 'formChanged' // the template's items changed: fill it again
  | 'photo' // the server refused the photo: take a new one
  | 'tooLarge' // over the size limit: take a new one
  | 'validation' // the data is wrong: correct it
  | 'unassigned' // 403: an admin has to act, then retry
  | 'duplicateId' // 409: needs a new id
  | 'completed' // 409: the work order was already submitted; nothing can send this
  | 'outOfDates' // 422: an admin has to act, then retry
  | 'other';

/** Turns the server's refusal into the recovery that can actually help. */
export function failureKind(error: OutboxError): FailureKind {
  if (error.status === 400) {
    if ('missing' in error.body || 'unknown' in error.body)
      return 'formChanged';
    if (error.messages.some((m) => m.startsWith('photo '))) return 'photo';
    return 'validation';
  }
  if (error.status === 403) return 'unassigned';
  if (error.status === 409) {
    return error.messages.some((m) => m.includes('work order'))
      ? 'completed'
      : 'duplicateId';
  }
  if (error.status === 413) return 'tooLarge';
  if (error.status === 422) return 'outOfDates';
  return 'other';
}

/** In plain words, as something a person can act on: never a status code. */
export function failureReason(error: OutboxError, t: Messages): string {
  const message = error.messages.join(' · ');
  switch (failureKind(error)) {
    case 'formChanged':
      return t.outbox.reasonFormChanged;
    case 'photo':
      return t.outbox.reasonPhoto;
    case 'tooLarge':
      return t.outbox.reasonTooLarge;
    case 'validation':
      return t.outbox.reasonValidation(message);
    case 'unassigned':
      return t.outbox.reasonUnassigned;
    case 'duplicateId':
      return t.outbox.reasonDuplicateId;
    case 'completed':
      return t.outbox.reasonCompleted;
    case 'outOfDates':
      return t.outbox.reasonOutOfDates;
    case 'other':
      return t.outbox.reasonOther(message);
  }
}

/** Sends it again with the same id: the server stored nothing for it, so the id is free. */
export async function retryEntry(
  id: string,
  inspectorId: string,
): Promise<void> {
  await outboxDb.outbox.where({ id }).modify((record) => {
    record.status = 'pending';
    delete record.lastError;
  });
  void syncOutbox(inspectorId);
}

/** Corrects a refused entry, keeping its id and the time it was filled. */
export async function correctEntry(
  record: OutboxRecord,
  draft: DraftInput,
): Promise<void> {
  await outboxDb.outbox.where({ id: record.id }).modify((stored) => {
    stored.answers = record.itemsSnapshot.map((item) => {
      const { answer, note } = draft.answersByItem[item.id];
      return { itemId: item.id, answer, note: note.trim() || null };
    });
    stored.photo = draft.photo;
    stored.status = 'pending';
    delete stored.lastError;
  });
  void syncOutbox(record.inspectorId);
}

/** 409 only: copies the entry under a new id. Never used for an ordinary retry. */
export async function resubmitAsNew(record: OutboxRecord): Promise<void> {
  const copy: OutboxRecord = {
    ...record,
    id: crypto.randomUUID(),
    status: 'pending',
    attempts: 0,
  };
  delete copy.lastError;
  await outboxDb.transaction('rw', outboxDb.outbox, async () => {
    await outboxDb.outbox.add(copy);
    await outboxDb.outbox.delete(record.id);
  });
  void syncOutbox(record.inspectorId);
}

/** Only ever after the inspector confirms: a failed entry is never discarded automatically. */
export async function discardEntry(id: string): Promise<void> {
  await outboxDb.outbox.delete(id);
}
