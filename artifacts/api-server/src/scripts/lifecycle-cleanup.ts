import { db, jobs } from "@workspace/db";
import { eq, and, lt, sql, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

const ARCHIVE_DAYS = Number(process.env.CLEANUP_ARCHIVE_DAYS) || 30;
const DELETE_DAYS = Number(process.env.CLEANUP_DELETE_DAYS) || 60;
const DRY_RUN = process.env.CLEANUP_DRY_RUN === "true";

interface CleanupResult {
  archived: number;
  deleted: number;
  duplicatesRemoved: number;
  integrityFixed: number;
}

function sqlOr(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}

async function archiveOldJobs(dryRun: boolean): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS);

  const candidates = await db
    .select({ id: jobs.id, title: jobs.title, company: jobs.company, lastSeenAt: jobs.lastSeenAt })
    .from(jobs)
    .where(
      and(
        eq(jobs.isArchived, false),
        eq(jobs.status, "active"),
        lt(sql`COALESCE(${jobs.lastSeenAt}, ${jobs.createdAt})`, cutoff),
      ),
    );

  if (candidates.length === 0) {
    logger.info("No jobs to archive");
    return 0;
  }

  logger.info({ count: candidates.length, threshold: `${ARCHIVE_DAYS}d` }, "Jobs eligible for archiving");

  if (dryRun) {
    for (const j of candidates.slice(0, 5)) {
      logger.info({ id: j.id, title: j.title, company: j.company }, "[DRY RUN] Would archive");
    }
    if (candidates.length > 5) {
      logger.info({ more: candidates.length - 5 }, "[DRY RUN] ... and more");
    }
    return 0;
  }

  const ids = candidates.map((c) => c.id);
  const batchSize = 50;
  let archived = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const result = await db
      .update(jobs)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        status: "expired",
      })
      .where(inArray(jobs.id, batch))
      .returning({ id: jobs.id });

    archived += result.length;
  }

  logger.info({ archived, threshold: `${ARCHIVE_DAYS}d` }, "Jobs archived");
  return archived;
}

async function deleteArchivedJobs(dryRun: boolean): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELETE_DAYS);

  const candidates = await db
    .select({ id: jobs.id, title: jobs.title, company: jobs.company, archivedAt: jobs.archivedAt })
    .from(jobs)
    .where(
      and(
        eq(jobs.isArchived, true),
        lt(sql`COALESCE(${jobs.archivedAt}, NOW())`, cutoff),
      ),
    );

  if (candidates.length === 0) {
    logger.info("No archived jobs to delete");
    return 0;
  }

  logger.info({ count: candidates.length, threshold: `${DELETE_DAYS}d` }, "Archived jobs eligible for deletion");

  if (dryRun) {
    for (const j of candidates.slice(0, 5)) {
      logger.info({ id: j.id, title: j.title }, "[DRY RUN] Would permanently delete");
    }
    if (candidates.length > 5) {
      logger.info({ more: candidates.length - 5 }, "[DRY RUN] ... and more");
    }
    return 0;
  }

  const ids = candidates.map((c) => c.id);
  const batchSize = 50;
  let deleted = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const result = await db.delete(jobs).where(inArray(jobs.id, batch)).returning({ id: jobs.id });
    deleted += result.length;
  }

  logger.info({ deleted, threshold: `${DELETE_DAYS}d` }, "Archived jobs permanently deleted");
  return deleted;
}

async function deduplicateJobs(dryRun: boolean): Promise<number> {
  const duplicates = await db.execute(sql`
    WITH ranked AS (
      SELECT
        id,
        title,
        company,
        source,
        source_url,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(title), LOWER(company), source, COALESCE(source_url, '')
          ORDER BY last_seen_at DESC NULLS LAST, created_at DESC
        ) AS rn
      FROM jobs
      WHERE status = 'active' AND is_archived = false
    )
    SELECT id, title, company, source FROM ranked WHERE rn > 1
  `);

  const rows = duplicates.rows as Array<{ id: number; title: string; company: string; source: string }>;
  if (rows.length === 0) {
    logger.info("No duplicate jobs found");
    return 0;
  }

  logger.info({ count: rows.length }, "Duplicate jobs found");

  if (dryRun) {
    for (const r of rows.slice(0, 5)) {
      logger.info({ id: r.id, title: r.title, company: r.company, source: r.source }, "[DRY RUN] Would remove duplicate");
    }
    if (rows.length > 5) {
      logger.info({ more: rows.length - 5 }, "[DRY RUN] ... and more");
    }
    return 0;
  }

  const ids = rows.map((r) => r.id);
  const batchSize = 50;
  let removed = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await db.delete(jobs).where(inArray(jobs.id, batch));
    removed += batch.length;
  }

  logger.info({ removed }, "Duplicate jobs removed");
  return removed;
}

async function integrityCleanup(dryRun: boolean): Promise<number> {
  const malformed = await db
    .select({ id: jobs.id, title: jobs.title })
    .from(jobs)
    .where(
      sqlOr(
        sql`LENGTH(TRIM(title)) = 0`,
        sql`title IS NULL`,
        sql`LENGTH(TRIM(company)) = 0`,
        sql`company IS NULL`,
        sql`LENGTH(TRIM(location)) = 0`,
        sql`location IS NULL`,
        sql`LENGTH(TRIM(description)) = 0`,
        sql`description IS NULL`,
      ),
    )
    .limit(200);

  const invalid = (malformed as Array<{ id: number; title: string }>).filter((r) => {
    const hasTitle = r.title && r.title.trim().length > 0;
    return !hasTitle;
  });

  if (invalid.length === 0) {
    logger.info("No integrity issues found");
    return 0;
  }

  logger.info({ count: invalid.length }, "Jobs with integrity issues");

  if (dryRun) {
    for (const j of invalid.slice(0, 5)) {
      logger.info({ id: j.id }, "[DRY RUN] Would remove malformed job");
    }
    if (invalid.length > 5) {
      logger.info({ more: invalid.length - 5 }, "[DRY RUN] ... and more");
    }
    return 0;
  }

  const ids = invalid.map((j) => j.id);
  await db.delete(jobs).where(inArray(jobs.id, ids));
  logger.info({ removed: ids.length }, "Malformed jobs removed");
  return ids.length;
}

async function main() {
  logger.info({
    archiveDays: ARCHIVE_DAYS,
    deleteDays: DELETE_DAYS,
    dryRun: DRY_RUN,
  }, "Starting lifecycle cleanup");

  const result: CleanupResult = {
    archived: 0,
    deleted: 0,
    duplicatesRemoved: 0,
    integrityFixed: 0,
  };

  try {
    result.archived = await archiveOldJobs(DRY_RUN);
    result.deleted = await deleteArchivedJobs(DRY_RUN);
    result.duplicatesRemoved = await deduplicateJobs(DRY_RUN);
    result.integrityFixed = await integrityCleanup(DRY_RUN);

    logger.info(result, "Lifecycle cleanup completed");
  } catch (err: any) {
    logger.error({ err }, "Lifecycle cleanup failed");
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Fatal error in lifecycle cleanup");
  process.exit(1);
});
