import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

// تعريف نموذج التفتيش
export const inspectionTemplates = pgTable(
  'inspection_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    validFrom: date('valid_from').notNull(),
    // null = open-ended
    validTo: date('valid_to'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      'template_dates_chk',
      sql`${t.validTo} IS NULL OR ${t.validTo} >= ${t.validFrom}`,
    ),
    // active template lookup per project
    index('inspection_templates_project_idx').on(
      t.projectId,
      t.validFrom.desc(),
    ),
  ],
);
