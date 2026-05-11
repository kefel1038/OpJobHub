import mammoth from "mammoth";

async function getPdfParser(): Promise<(buffer: Buffer) => Promise<{ text: string }>> {
  // Lazily loaded — pdf-parse v2 requires browser APIs (DOMMatrix) that aren't
  // available in all server environments (e.g. Vercel serverless).
  const { createRequire } = await import("module");
  const req = createRequire(import.meta.url);
  return req("pdf-parse");
}

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdf = await getPdfParser();
    const data = await pdf(buffer);
    return data.text;
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (mimeType.startsWith("text/")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
