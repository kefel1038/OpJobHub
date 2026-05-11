import mammoth from "mammoth";

let _pdfParse: ((buffer: Buffer) => Promise<{ text: string }>) | null = null;

async function getPdfParser(): Promise<(buffer: Buffer) => Promise<{ text: string }>> {
  if (_pdfParse) return _pdfParse;
  const mod = await import("pdf-parse");
  _pdfParse = mod.default || mod;
  return _pdfParse;
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
