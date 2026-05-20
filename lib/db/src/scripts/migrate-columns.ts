import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import pg from "pg";
import { resolve4 } from "dns/promises";

const { Pool } = pg;

async function getIpv4ConnectionString(url: string): Promise<string> {
  const hostMatch = url.match(/\/\/([^@]+@)?([^:\/\s?#]+)/);
  if (!hostMatch) return url;
  const host = hostMatch[2];

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return url;

  if (host.startsWith("[")) {
    console.error("");
    console.error("ERROR: DATABASE_URL contains an IPv6 literal.");
    console.error("Update the DATABASE_URL secret to use your Supabase hostname");
    console.error("(e.g. db.xxxxx.supabase.co) instead of the IPv6 address.");
    process.exit(1);
  }

  if ((host.match(/:/g) || []).length > 1) {
    console.error("");
    console.error("ERROR: DATABASE_URL contains a bare IPv6 address.");
    console.error("Update the DATABASE_URL secret to use your Supabase hostname");
    console.error("(e.g. db.xxxxx.supabase.co) instead.");
    process.exit(1);
  }

  try {
    const addrs = await resolve4(host);
    const ipv4 = addrs[0];
    console.log(`Resolved ${host} → ${ipv4}`);
    return url.replace(host, ipv4);
  } catch {
    console.error("");
    console.error("========================================================================");
    console.error("  Cannot reach your Supabase database from GitHub Actions.");
    console.error("  Reason: Your project is IPv6-only (no IPv4 DNS record).");
    console.error("  GHA runners do not have IPv6 connectivity.");
    console.error("");
    console.error("  Fix: Add an IPv4 address to your Supabase project:");
    console.error("  https://supabase.com/dashboard/project/fmcblciptvnagrpsrzcw/settings/database");
    console.error("  → scroll to 'IPv4 Add-on' → enable it");
    console.error("");
    console.error("  Alternatively, update DATABASE_URL to use a region pooler:");
    console.error("  postgresql://postgres:password@aws-0-REGION.pooler.supabase.com:5432/postgres");
    console.error("  (Replace REGION with your project's AWS region)");
    console.error("========================================================================");
    console.error("");
    process.exit(1);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const dbUrl = await getIpv4ConnectionString(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: dbUrl });
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
