export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const RESUME_MIME_TYPES: Record<string, "pdf" | "docx" | "txt"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

export class ResumeParseError extends Error {}

export function detectResumeKind(fileName: string, mimeType: string): "pdf" | "docx" | "txt" | null {
  const byMime = RESUME_MIME_TYPES[mimeType];
  if (byMime) return byMime;
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "pdf" || ext === "docx" || ext === "txt") return ext;
  return null;
}

export function normalizeResumeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResumeText(buffer: Buffer, kind: "pdf" | "docx" | "txt"): Promise<string> {
  let text: string;
  try {
    if (kind === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = result.text;
    } else if (kind === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf8");
    }
  } catch (error) {
    throw new ResumeParseError(`Could not read the ${kind.toUpperCase()} file`, { cause: error });
  }
  const normalized = normalizeResumeText(text);
  if (normalized.length < 50) {
    throw new ResumeParseError(
      "We couldn't find enough text in this file. If it's a scanned PDF, export it as a text-based PDF or DOCX.",
    );
  }
  return normalized;
}
