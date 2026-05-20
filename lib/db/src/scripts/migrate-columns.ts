import pg from "pg";
import { resolve4 } from "dns/promises";

const { Pool } = pg;

async function getIpv4ConnectionString(url: string): Promise<string> {
  const hostMatch = url.match(/\/\/([^@]+@)?([^:\/\s?#]+)/);
  if (!hostMatch) return url;
  const host = hostMatch[2];

  // If it's already an IPv4 literal, nothing to do
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return url;

  // If it's an IPv6 literal, we cannot resolve to IPv4 — user must use hostname
  if (host.startsWith("[")) {
    console.error("ERROR: DATABASE_URL contains an IPv6 literal. GitHub Actions does not support IPv6.");
    console.error("Update the DATABASE_URL secret to use your Supabase hostname (e.g. db.xxxxx.supabase.co) instead of the IPv6 address.");
    process.exit(1);
  }

  // Heuristic: bare IPv6 without brackets (contains multiple colons)
  if ((host.match(/:/g) || []).length > 1) {
    console.error("ERROR: DATABASE_URL contains a bare IPv6 address. GitHub Actions does not support IPv6.");
    console.error("Update the DATABASE_URL secret to use your Supabase hostname (e.g. db.xxxxx.supabase.co) instead.");
    process.exit(1);
  }

  // Resolve hostname to IPv4
  try {
    const addrs = await resolve4(host);
    const ipv4 = addrs[0];
    console.log(`Resolved ${host} → ${ipv4}`);
    return url.replace(host, ipv4);
  } catch {
    console.error("");
    console.error("========================================================================");
    console.error("  Cannot reach your Supabase database from GitHub Actions.");
    console.error("  Reason: Your project is IPv6-only, but GHA runners don't have IPv6.");
    console.error("");
    console.error("  Fix: Enable the IPv4 add-on in your Supabase project:");
    console.error("  https://supabase.com/dashboard/project/fmcblciptvnagrpsrzcw/settings/database");
    console.error("  → scroll to 'IPv4 Add-on' → enable it");
    console.error("");
    console.error("  After enabling, update the DATABASE_URL secret in your GitHub repo.");
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
