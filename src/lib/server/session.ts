import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";

/** User id for the current request, or null when signed out. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  return id && isValidObjectId(id) ? id : null;
}

/** For server components/pages: redirects to /login when signed out. */
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/login");
  return id;
}
