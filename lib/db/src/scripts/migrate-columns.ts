import pg from "pg";

const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Running schema migration for missing columns...");

    const migrations = [
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freshness_score INTEGER`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_size TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_overview TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_resume_optimization JSONB DEFAULT '[]'::jsonb`,
    ];

    for (const sql of migrations) {
      try {
        await client.query(sql);
        const colName = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
        console.log(`  ✓ ${colName}`);
      } catch (err: any) {
        console.error(`  ✗ ${sql.split(" ").slice(-3, -1).join(" ")}: ${err.message}`);
      }
    }

    console.log("Schema migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
