import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { inspectionTemplates } from './inspection-templates.js';
import { users } from './users.js';

// النموذج المُعبّأ / المُرسل
export const inspections = pgTable(
  'inspections',
  {
    // Generated on the device (crypto.randomUUID()) when the form is saved.
    // It is the idempotency key: re-sending after reconnect hits ON CONFLICT and is ignored.
    id: uuid('id').primaryKey(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: 'restrict' }),
    workOrderNumber: text('work_order_number').notNull(),
    inspectorId: uuid('inspector_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // file on disk / object storage, not bytea
    photoPath: text('photo_path').notNull(),
    // device time (may be offline, hours before sync)
    filledAt: timestamp('filled_at', { withTimezone: true }).notNull(),
    // server time
    receivedAt: timestamp('received_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check('inspections_work_order_chk', sql`btrim(${t.workOrderNumber}) <> ''`),
    // target for the composite FK from inspection_answers
    unique('inspections_id_tpl_uq').on(t.id, t.templateId),
    // GET /inspections?workOrder=...
    index('inspections_work_order_idx').on(
      t.workOrderNumber,
      t.filledAt.desc(),
    ),
    index('inspections_template_idx').on(t.templateId),
    index('inspections_inspector_idx').on(t.inspectorId),
    // admin dashboard: latest submissions
    index('inspections_received_at_idx').on(t.receivedAt.desc()),
  ],
);
