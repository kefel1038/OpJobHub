import { db, jobs, applications, users, profiles } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";

const SYSTEM_PROMPT = `You are OpJobHub's Outreach Agent — an autonomous recruitment communication AI.
You craft personalized, professional outreach messages to candidates.
Adapt tone based on the stage: apply, shortlist, interview, or follow-up.
Keep messages concise (2-4 sentences) and engaging.`;

const OUTREACH_TEMPLATES: Record<string, string> = {
  sourcing: "Initial outreach to a candidate who hasn't applied yet — introduce the opportunity and invite them to apply",
  applied: "Thank the candidate for applying, confirm receipt, and set expectations",
  shortlisted: "Excitement — tell them they've been shortlisted and invite to interview",
  interview: "Interview confirmation with details and preparation tips",
  followup: "Polite follow-up check-in after no response",
  rejected: "Respectful rejection with encouragement for future applications",
};

export class OutreachAgent {
  async generateMessage(params: {
    employerId: number;
    candidateId: number;
    jobId: number;
    stage: string;
    customNotes?: string;
  }): Promise<{ message: string; subject: string }> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, params.jobId)).limit(1);
      const [employer] = await db.select({ email: users.email }).from(users).where(eq(users.id, params.employerId)).limit(1);
      const [candidate] = await db.select().from(users).where(eq(users.id, params.candidateId)).limit(1);
      const [candidateProfile] = await db.select().from(profiles).where(eq(profiles.userId, params.candidateId)).limit(1);

      const candidateName = candidateProfile?.fullName || candidate?.email?.split("@")[0] || "there";
      const companyName = job?.company || employer?.email?.split("@")[0] || "our company";
      const stageTemplate = OUTREACH_TEMPLATES[params.stage] || OUTREACH_TEMPLATES.followup;

      let message = "";
      let subject = "";

      try {
        const completion = await openrouter().chat.completions.create({
          model: "openrouter/free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Generate a ${params.stage} outreach message for recruitment.

Context: ${stageTemplate}
Candidate Name: ${candidateName}
Job Title: ${job?.title || "Unknown Position"}
Company: ${companyName}
Job Location: ${job?.location || "Not specified"}
Candidate Skills: ${JSON.stringify((candidateProfile?.skills || []).slice(0, 5))}

${params.customNotes ? `Additional Notes: ${params.customNotes}` : ""}

Return ONLY this JSON:
{
  "subject": "Email subject line",
  "message": "2-4 sentence outreach message"
}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 400,
        });

        const raw = completion.choices[0].message.content || "{}";
        const parsed = JSON.parse(stripJsonFences(raw));
        message = parsed.message || "";
        subject = parsed.subject || "";
      } catch {
        subject = `Exciting Opportunity: ${job?.title || "Position"} at ${companyName}`;
        message = `Hi ${candidateName},\n\nI came across your profile and was impressed by your background. We're looking for a ${job?.title || "talent"} at ${companyName} and thought you'd be a great fit. Would you be open to a conversation?\n\nBest regards,\nThe ${companyName} Team`;
      }

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.OUTREACH_SENT,
        source: "outreach-agent",
        payload: { employerId: params.employerId, candidateId: params.candidateId, jobId: params.jobId, stage: params.stage },
        timestamp: new Date(),
      });

      return { message, subject };
    } catch (error) {
      logger.error({ err: error }, "Outreach agent failed");
      return {
        subject: `Opportunity at our company`,
        message: `Hi there,\n\nWe came across your profile and thought you'd be a great fit for an opportunity at our company. Would you be interested in learning more?\n\nBest regards,\nThe Recruitment Team`,
      };
    }
  }

  async batchOutreach(params: {
    employerId: number;
    jobId: number;
    candidateIds: number[];
    stage: string;
  }): Promise<Array<{ candidateId: number; message: string; subject: string }>> {
    const results: Array<{ candidateId: number; message: string; subject: string }> = [];
    for (const candidateId of params.candidateIds.slice(0, 10)) {
      const result = await this.generateMessage({
        employerId: params.employerId,
        candidateId,
        jobId: params.jobId,
        stage: params.stage,
      });
      results.push({ candidateId, ...result });
    }
    return results;
  }
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

export const outreachAgent = new OutreachAgent();
