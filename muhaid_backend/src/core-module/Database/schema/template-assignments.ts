import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { inspectionTemplates } from './inspection-templates.js';
import { users } from './users.js';

// which inspector may fill which template
export const templateAssignments = pgTable(
  'template_assignments',
  {
    templateId: uuid('template_id')
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedBy: uuid('assigned_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    // the work order (أمر العمل), generated from work_order_seq (see migration 0003)
    workOrderNumber: text('work_order_number')
      .notNull()
      .default(sql`'WO-' || lpad(nextval('work_order_seq')::text, 6, '0')`),
    // set when the inspector's submission for this work order is stored; one-time job
    completedAt: timestamp('completed_at', { withTimezone: true }),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.templateId, t.userId] }),
    // GET /web/templates: templates assigned to me
    index('template_assignments_user_idx').on(t.userId),
    unique('template_assignments_work_order_number_unique').on(
      t.workOrderNumber,
    ),
  ],
);
