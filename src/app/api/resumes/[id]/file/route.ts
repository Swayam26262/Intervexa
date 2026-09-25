import { withUser } from "@/lib/server/api";
import { getResumeFile } from "@/lib/server/resume-service";

/** Downloads the original (decrypted) resume file. */
export const GET = withUser(async (userId, _request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const file = await getResumeFile(userId, (await params).id);
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store",
    },
  });
});
