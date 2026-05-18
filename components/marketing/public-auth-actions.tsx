"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function PublicAuthActions() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <Button disabled variant="ghost">
        Sign in
      </Button>
    );
  }

  if (isSignedIn) {
    return (
      <>
        <Button asChild variant="outline">
          <Link href="/app">Dashboard</Link>
        </Button>
        <UserButton />
      </>
    );
  }

  return (
    <>
      <Button asChild variant="ghost">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild>
        <Link href="/sign-up">Get started</Link>
      </Button>
    </>
  );
}
