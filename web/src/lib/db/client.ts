import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// lazy proxy: build 時に DATABASE_URL が未設定でも落ちない
const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_, prop) {
    const client = neon(process.env.DATABASE_URL!);
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db = drizzle(sql, { schema });
