import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { answerValue } from './enums.js';
import { inspections } from './inspections.js';
import { templateItems } from './template-items.js';

// إجابة كل بند
export const inspectionAnswers = pgTable(
  'inspection_answers',
  {
    inspectionId: uuid('inspection_id').notNull(),
    // only here so the two composite FKs below can match
    templateId: uuid('template_id').notNull(),
    itemId: uuid('item_id').notNull(),
    // snapshot of the question text at submission time
    itemLabel: text('item_label').notNull(),
    answer: answerValue('answer').notNull(),
    note: text('note'),
  },
  (t) => [
    // one answer per item per inspection
    primaryKey({ columns: [t.inspectionId, t.itemId] }),
    // the answer belongs to an inspection of THIS template ...
    foreignKey({
      name: 'inspection_answers_inspection_fk',
      columns: [t.inspectionId, t.templateId],
      foreignColumns: [inspections.id, inspections.templateId],
    }).onDelete('cascade'),
    // ... and the item belongs to the SAME template (no cross-template answers)
    foreignKey({
      name: 'inspection_answers_item_fk',
      columns: [t.templateId, t.itemId],
      foreignColumns: [templateItems.templateId, templateItems.id],
    }).onDelete('restrict'),
    // الملاحظة إلزامية عند اختيار «لا»
    check(
      'note_required_when_no_chk',
      sql`${t.answer} <> 'no' OR (${t.note} IS NOT NULL AND btrim(${t.note}) <> '')`,
    ),
    index('inspection_answers_item_idx').on(t.templateId, t.itemId),
  ],
);
