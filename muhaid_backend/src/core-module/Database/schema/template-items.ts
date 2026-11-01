import { sql } from 'drizzle-orm';
import {
  check,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { inspectionTemplates } from './inspection-templates.js';

// بنود النموذج: an item is only the question; yes/no/na answers live in inspection_answers.
export const templateItems = pgTable(
  'template_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: 'cascade' }),
    position: smallint('position').notNull(),
    label: text('label').notNull(),
  },
  (t) => [
    check('template_items_position_chk', sql`${t.position} > 0`),
    unique('template_items_position_uq').on(t.templateId, t.position),
    // target for the composite FK from inspection_answers
    unique('template_items_tpl_id_uq').on(t.templateId, t.id),
  ],
);
