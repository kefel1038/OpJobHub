import { EventEmitter } from "events";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface RecruitmentEvent {
  type: string;
  source: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

type EventHandler = (event: RecruitmentEvent) => Promise<void>;

class RecruitmentEventBus extends EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private history: RecruitmentEvent[] = [];
  private maxHistory = 1000;

  on(eventType: string, handler: EventHandler): this {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return this;
  }

  off(eventType: string, handler: EventHandler): this {
    this.handlers.get(eventType)?.delete(handler);
    return this;
  }

  async emitEvent(event: RecruitmentEvent): Promise<void> {
    this.history.push(event);
    if (this.history.length > this.maxHistory) this.history.shift();

    try {
      await db.execute(sql`
        INSERT INTO agent_events (event_type, source, payload, metadata)
        VALUES (${event.type}, ${event.source}, ${JSON.stringify(event.payload)}::jsonb, ${JSON.stringify(event.metadata || {})}::jsonb)
      `);
    } catch (err) {
      logger.error({ err, eventType: event.type }, "Failed to persist event");
    }

    const handlers = this.handlers.get(event.type) || new Set();
    const wildcardHandlers = this.handlers.get("*") || new Set();
    const allHandlers = [...handlers, ...wildcardHandlers];

    await Promise.allSettled(
      allHandlers.map((handler) =>
        handler(event).catch((err) => {
          logger.error({ err, eventType: event.type }, "Event handler failed");
        })
      )
    );
  }

  getRecentEvents(type?: string, limit = 20): RecruitmentEvent[] {
    const filtered = type ? this.history.filter((e) => e.type === type) : this.history;
    return filtered.slice(-limit);
  }
}

export const eventBus = new RecruitmentEventBus();

export const RecruitmentEventTypes = {
  JOB_POSTED: "job.posted",
  JOB_UPDATED: "job.updated",
  CANDIDATE_APPLIED: "candidate.applied",
  CANDIDATE_SCORED: "candidate.scored",
  CANDIDATE_SHORTLISTED: "candidate.shortlisted",
  CANDIDATE_HIRED: "candidate.hired",
  CANDIDATE_REJECTED: "candidate.rejected",
  CANDIDATE_GHOSTED: "candidate.ghosted",
  INTERVIEW_SCHEDULED: "interview.scheduled",
  INTERVIEW_MISSED: "interview.missed",
  INTERVIEW_COMPLETED: "interview.completed",
  OUTREACH_SENT: "outreach.sent",
  OUTREACH_REPLIED: "outreach.replied",
  RECRUITER_INACTIVE: "recruiter.inactive",
  HIRING_SPIKE: "hiring.spike",
  AGENT_ACTION: "agent.action",
  SYSTEM_ALERT: "system.alert",
} as const;
