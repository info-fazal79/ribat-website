import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

/**
 * Data-access-layer guards. `proxy.ts` only does optimistic checks —
 * every admin page, server action and route handler must call one of these.
 * They read the session, so callers must render inside <Suspense>.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}
