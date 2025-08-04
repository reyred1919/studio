<<<<<<< HEAD
/*
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

const client = postgres(process.env.POSTGRES_URL, { ssl: 'require' });
export const db = drizzle(client, { schema });
*/

// Mock db object to avoid breaking imports
export const db = {};
=======

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
