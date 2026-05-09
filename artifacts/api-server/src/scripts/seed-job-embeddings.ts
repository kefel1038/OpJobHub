import { db, jobs, jobEmbeddings } from "@workspace/db";
import { getEmbedding } from "../lib/openai";
import { logger } from "../lib/logger";

async function seed() {
  logger.info("Starting job embedding seeding...");
  
  const allJobs = await db.select().from(jobs);
  logger.info(`Found ${allJobs.length} jobs to process.`);

  for (const job of allJobs) {
    try {
      const text = `${job.title} at ${job.company}. ${job.description} Location: ${job.location}`;
      const embedding = await getEmbedding(text);
      
      await db.insert(jobEmbeddings).values({
        jobId: job.id,
        embedding,
      }).onConflictDoUpdate({
        target: jobEmbeddings.jobId,
        set: { embedding }
      });
      
      logger.info(`Generated embedding for job: ${job.title}`);
    } catch (error) {
      logger.error({ err: error, jobId: job.id }, "Failed to generate embedding for job");
    }
  }
  
  logger.info("Finished seeding job embeddings.");
  process.exit(0);
}

seed().catch(err => {
  logger.error({ err }, "Seed script failed");
  process.exit(1);
});
