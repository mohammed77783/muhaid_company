// Creates the first admin user. Safe to re-run: an existing email is left untouched.
// Usage: npm run db:seed   (NODE_ENV=production npm run db:seed for .env.production)
import argon2 from 'argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema/index.js';

process.loadEnvFile(
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
);

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });
const db = drizzle({ client: pool, schema });

try {
  const email = requireEnv('ADMIN_EMAIL').toLowerCase();
  const inserted = await db
    .insert(schema.users)
    .values({
      name: requireEnv('ADMIN_NAME'),
      email,
      passwordHash: await argon2.hash(requireEnv('ADMIN_PASSWORD')),
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning({ id: schema.users.id });

  console.log(
    inserted.length
      ? `Admin created: ${email}`
      : `Admin already exists: ${email}`,
  );
} finally {
  await pool.end();
}
