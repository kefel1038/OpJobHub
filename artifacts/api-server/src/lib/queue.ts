import { Queue, Worker, type Processor } from "bullmq";
import IORedis from "ioredis";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let _connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => Math.min(times * 100, 5000),
    });
    _connection.on("error", (err) => logger.error({ err }, "Redis connection error"));
  }
  return _connection;
}

export enum QueueNames {
  GRAPH_SYNC = "graph-sync",
  ENRICHMENT = "enrichment",
  VERIFICATION = "verification",
  SOURCING = "sourcing",
  GRAPH_RAG = "graph-rag",
  EMBEDDINGS = "embeddings",
  OBSERVABILITY = "observability",
  PIPELINE = "pipeline",
}

const _queues = new Map<string, Queue>();

export function getQueue(name: QueueNames): Queue {
  if (!_queues.has(name)) {
    const queue = new Queue(name, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600 * 24, count: 500 },
        removeOnFail: { age: 3600 * 24 * 7 },
      },
    });
    _queues.set(name, queue);
  }
  return _queues.get(name)!;
}

export function createWorker(name: QueueNames, processor: Processor): Worker {
  const worker = new Worker(name, processor, {
    connection: getConnection(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
    limiter: {
      max: parseInt(process.env.WORKER_RATE_LIMIT || "50", 10),
      duration: 1000,
    },
  });

  worker.on("completed", (job) => {
    logger.debug({ queue: name, jobId: job.id }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ queue: name, jobId: job?.id, err }, "Job failed");
  });

  return worker;
}

export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of _queues) {
    await queue.close();
    logger.info({ queue: name }, "Queue closed");
  }
  _queues.clear();
  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}
