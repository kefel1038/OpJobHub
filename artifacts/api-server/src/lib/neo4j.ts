import neo4j, { type Driver, type Session } from "neo4j-driver";
import { logger } from "./logger";

let _driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!_driver) {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "password";

    _driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 10,
      connectionTimeout: 10000,
      logging: {
        level: process.env.NODE_ENV === "production" ? "warn" : "info",
        logger: (_level: string, _message: string) => {},
      } as any,
    });

    logger.info({ uri: uri.replace(/\/\/.*@/, "//***@") }, "Neo4j driver initialized");
  }
  return _driver;
}

export async function getNeo4jSession(): Promise<Session> {
  const driver = getNeo4jDriver();
  return driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });
}

export async function verifyNeo4jConnection(): Promise<boolean> {
  try {
    const session = await getNeo4jSession();
    const result = await session.run("RETURN 1 AS test");
    await session.close();
    return result.records[0]?.get("test") === 1;
  } catch (err) {
    logger.error({ err }, "Neo4j connection verification failed");
    return false;
  }
}

export async function closeNeo4j(): Promise<void> {
  if (_driver) {
    await _driver.close();
    _driver = null;
    logger.info("Neo4j driver closed");
  }
}

export async function runCypher(query: string, params?: Record<string, unknown>): Promise<any[]> {
  const session = await getNeo4jSession();
  try {
    const result = await session.run(query, params || {});
    return result.records.map((record: any) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key: string) => {
        const value = record.get(key);
        obj[key] = value !== null && typeof value === "object" && "properties" in value
          ? { ...value.properties, _id: value.identity?.toString(), _labels: value.labels }
          : value;
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

export async function runCypherRaw(query: string, params?: Record<string, unknown>): Promise<{ records: any[]; summary: any }> {
  const session = await getNeo4jSession();
  try {
    const result = await session.run(query, params || {});
    return {
      records: result.records.map((record: any) => {
        const obj: Record<string, unknown> = {};
        record.keys.forEach((key: string) => {
          obj[key] = record.get(key);
        });
        return obj;
      }),
      summary: result.summary,
    };
  } finally {
    await session.close();
  }
}
