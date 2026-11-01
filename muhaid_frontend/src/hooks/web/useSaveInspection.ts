import { useCallback } from 'react';

import { outboxDb } from '../../lib/offline/outboxDb';
import { syncOutbox } from '../../lib/offline/syncOutbox';
import type { DraftInput, OutboxRecord } from '../../types/web/inspections';
import type { WebTemplate } from '../../types/web/templates';
import { useCurrentUser } from '../useCurrentUser';

type SaveInspection = (
  draft: DraftInput,
  template: WebTemplate,
  /** A refused entry this new one replaces: it goes in the same step, so work is never lost. */
  replacesId?: string,
) => Promise<string>;

/**
 * Saving is local and instant: this, not opening the form, is when the id and filledAt are
 * fixed, so an abandoned form wastes no id. Answers are built from the template's items,
 * so there are no extras and no duplicates.
 */
export function useSaveInspection(): SaveInspection {
  const user = useCurrentUser();
  return useCallback(
    async (draft, template, replacesId) => {
      const record: OutboxRecord = {
        id: crypto.randomUUID(), // the idempotency key, generated ONCE
        inspectorId: user.id,
        templateId: template.id,
        templateName: template.name,
        projectCode: template.project.code,
        itemsSnapshot: template.items,
        workOrderNumber: template.workOrderNumber,
        filledAt: new Date().toISOString(), // device time, ends in Z
        answers: template.items.map((item) => {
          const { answer, note } = draft.answersByItem[item.id];
          return { itemId: item.id, answer, note: note.trim() || null };
        }),
        photo: draft.photo,
        status: 'pending',
        attempts: 0,
      };
      await outboxDb.transaction('rw', outboxDb.outbox, async () => {
        await outboxDb.outbox.add(record);
        if (replacesId) await outboxDb.outbox.delete(replacesId);
      });
      void syncOutbox(user.id); // try right away; fine if offline
      return record.id;
    },
    [user.id],
  );
}
