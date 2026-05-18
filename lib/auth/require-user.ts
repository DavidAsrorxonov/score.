import { auth } from "@clerk/nextjs/server";

export async function requireUserId(): Promise<string> {
  const { redirectToSignIn, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return userId;
}
