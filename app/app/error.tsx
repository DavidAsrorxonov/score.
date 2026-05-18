"use client";

import { useEffect } from "react";

import { PageContainer } from "@/components/app/page-container";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <ErrorState
        title="Dashboard could not load"
        description="Refresh the page or try again in a moment."
        action={
          <Button type="button" variant="outline" onClick={unstable_retry}>
            Try again
          </Button>
        }
      />
    </PageContainer>
  );
}
