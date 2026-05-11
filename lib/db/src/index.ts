import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function getPool(): Pool {
  const url =
    process.env.DATABASE_URL ||
    // Fallback for when DATABASE_URL hasn't been set in Vercel dashboard
    "postgresql://postgres:Lovr_1990_Lovr@db.fmcblciptvnagrpsrzcw.supabase.co:5432/postgres";
  return new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    _pool = getPool();
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export { schema };
export * from "./schema";
