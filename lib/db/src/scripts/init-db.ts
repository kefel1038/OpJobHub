import { getDb } from "../index";
import { sql } from "drizzle-orm";

async function init() {
  const client = await pool.connect();
  try {
    console.log("Checking for pgvector extension...");
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
    console.log("pgvector extension enabled.");
  } catch (error) {
    console.error("Failed to enable pgvector:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

init();
