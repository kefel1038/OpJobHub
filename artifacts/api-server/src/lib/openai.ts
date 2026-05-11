import OpenAI from "openai";

let _openrouter: OpenAI | null = null;
let _openaiEmbed: OpenAI | null = null;

export function openrouter(): OpenAI {
  if (!_openrouter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY must be set for AI features.");
    }
    _openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://op-job-hub.vercel.app",
        "X-Title": "OP Job Hub",
      },
    });
  }
  return _openrouter;
}

export async function getEmbedding(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    if (!_openaiEmbed) {
      _openaiEmbed = new OpenAI({ apiKey });
    }
    const response = await _openaiEmbed.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, " "),
    });
    return response.data[0].embedding;
  }
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}
