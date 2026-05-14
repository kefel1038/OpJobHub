import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";

interface PreferenceEmbedding {
  employerId: number;
  preferenceKey: string;
  preferenceValue: string;
  embedding: number[];
}

export class PreferenceEmbedder {
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "You are a text embedding generator. Given a preference description, return a JSON array of 128 floating point numbers representing its semantic embedding. Return ONLY valid JSON array, no markdown, no explanation.",
          },
          {
            role: "user",
            content: `Generate embedding for preference: ${text}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      });

      const content = response.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json?/gi, "").replace(/```/g, "").trim();
      const embedding = JSON.parse(cleaned);
      if (Array.isArray(embedding) && embedding.length > 0 && embedding.every((n) => typeof n === "number")) {
        return embedding;
      }
      return null;
    } catch (err) {
      logger.error({ err, text }, "Failed to generate preference embedding");
      return null;
    }
  }

  async storeEmbedding(employerId: number, key: string, value: string): Promise<boolean> {
    try {
      const embedding = await this.generateEmbedding(`${key}: ${value}`);
      if (!embedding) return false;

      await db.execute(sql`
        INSERT INTO preference_embeddings (employer_id, preference_key, preference_value, embedding)
        VALUES (${employerId}, ${key}, ${value}, ${JSON.stringify(embedding)})
        ON CONFLICT (employer_id, preference_key, preference_value)
        DO UPDATE SET embedding = ${JSON.stringify(embedding)}, updated_at = NOW()
      `);
      return true;
    } catch (err) {
      logger.error({ err, employerId, key, value }, "Failed to store preference embedding");
      return false;
    }
  }

  async getEmbedding(employerId: number, key: string, value: string): Promise<number[] | null> {
    try {
      const rows = await db.execute(sql`
        SELECT embedding FROM preference_embeddings
        WHERE employer_id = ${employerId} AND preference_key = ${key} AND preference_value = ${value}
      `);
      if (rows.rows?.length) {
        const embStr = (rows.rows[0] as any).embedding;
        if (embStr) return JSON.parse(embStr);
      }
      return null;
    } catch {
      return null;
    }
  }

  async computeSimilarity(embeddingA: number[], embeddingB: number[]): Promise<number> {
    if (embeddingA.length !== embeddingB.length || embeddingA.length === 0) return 0;
    const dotProduct = embeddingA.reduce((sum, a, i) => sum + a * embeddingB[i], 0);
    const magA = Math.sqrt(embeddingA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(embeddingB.reduce((sum, b) => sum + b * b, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  }

  async embedAllActivePreferences(employerId: number): Promise<number> {
    try {
      const rows = await db.execute(sql`
        SELECT preference_key, preference_value FROM inferred_preferences
        WHERE employer_id = ${employerId} AND is_active = true
      `);

      let embedded = 0;
      for (const row of rows.rows || []) {
        const r = row as any;
        const success = await this.storeEmbedding(employerId, r.preference_key, r.preference_value);
        if (success) embedded++;
      }
      return embedded;
    } catch (err) {
      logger.error({ err, employerId }, "Failed to embed all active preferences");
      return 0;
    }
  }
}

export const preferenceEmbedder = new PreferenceEmbedder();
