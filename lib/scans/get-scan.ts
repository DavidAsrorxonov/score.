import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { scans } from "@/lib/db/schema";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";

export async function getScanForCurrentUser(scanId: string) {
  const user = await getOrCreateCurrentUser();

  const [scan] = await db
    .select()
    .from(scans)
    .where(and(eq(scans.id, scanId), eq(scans.userId, user.id)))
    .limit(1);

  return scan ?? null;
}

