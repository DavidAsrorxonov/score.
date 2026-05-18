import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { User } from "@/lib/db/types";
import { DEFAULT_PLAN_CODE } from "@/lib/plans/constants";

function getClerkDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return null;
  }

  const assembledName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return user.fullName ?? user.username ?? (assembledName || null);
}

export async function getOrCreateCurrentUser(): Promise<User> {
  const clerkUserId = await requireUserId();
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const name = getClerkDisplayName(clerkUser);
  const imageUrl = clerkUser?.imageUrl ?? null;

  const [user] = await db
    .insert(users)
    .values({
      clerkUserId,
      email,
      imageUrl,
      name,
      planCode: DEFAULT_PLAN_CODE,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email,
        imageUrl,
        name,
      },
    })
    .returning();

  if (user) {
    return user;
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!existingUser) {
    throw new Error("Unable to load the current app user.");
  }

  return existingUser;
}
