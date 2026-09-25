import { withUser } from "@/lib/server/api";
import { exportAccount } from "@/lib/server/account-service";

export const GET = withUser(async (userId) => {
  const data = await exportAccount(userId);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="intervexa-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
});
