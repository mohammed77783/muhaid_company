import { sql } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { userRole } from './enums.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    // argon2 output, never plain text
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('inspector'),
    // users are deactivated, never deleted (their inspections reference them)
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // case-insensitive unique email
    uniqueIndex('users_email_lower_uq').on(sql`lower(${t.email})`),
  ],
);
