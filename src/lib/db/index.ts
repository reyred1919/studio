import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/drizzle/schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

const client = postgres(process.env.POSTGRES_URL, { ssl: 'require' });
export const db = drizzle(client, { schema });
