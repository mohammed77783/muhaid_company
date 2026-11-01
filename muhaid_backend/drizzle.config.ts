import { defineConfig } from 'drizzle-kit';

process.loadEnvFile(
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core-module/Database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
