"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useId, useState } from "react";

import { UsageMeter } from "@/components/shared/usage-meter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateScanResult, CreateScanType } from "@/lib/scans/types";

interface ScanFormUsage {
  usedToday: number;
  dailyLimit: number | null;
  remainingToday: number | null;
  isLimitReached: boolean;
  limitMessage: string;
}

export interface ScanFormProps {
  usage: ScanFormUsage;
}

function getRemainingCopy(usage: ScanFormUsage) {
  if (usage.remainingToday === null) {
    return "Your current plan has unlimited scans today.";
  }

  if (usage.remainingToday === 1) {
    return "You have 1 scan remaining today.";
  }

  return `You have ${usage.remainingToday} scans remaining today.`;
}

export function ScanForm({ usage }: ScanFormProps) {
  const router = useRouter();
  const inputId = useId();
  const scanTypeId = useId();
  const [input, setInput] = useState("");
  const [scanType, setScanType] = useState<CreateScanType>("single_url");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = usage.isLimitReached || isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      setError("Enter a domain or URL.");
      return;
    }

    if (trimmedInput.length > 2048) {
      setError("Enter a URL under 2048 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: trimmedInput,
          scanType,
        }),
      });
      const result = (await response.json()) as CreateScanResult;

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.push(`/app/scans/${result.scan.id}`);
      router.refresh();
    } catch {
      setError("The scan could not be created. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <UsageMeter used={usage.usedToday} limit={usage.dailyLimit} />
      {usage.isLimitReached ? (
        <Alert>
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>Daily limit reached</AlertTitle>
          <AlertDescription>{usage.limitMessage}</AlertDescription>
        </Alert>
      ) : (
        <p className="text-sm text-muted-foreground">
          {getRemainingCopy(usage)}
        </p>
      )}

      <form className="max-w-2xl space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            URL or domain
          </label>
          <Input
            id={inputId}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://example.com/pricing"
            disabled={isDisabled}
            aria-invalid={error ? true : undefined}
          />
          <p className="text-sm text-muted-foreground">
            Examples: example.com or https://example.com/pricing
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor={scanTypeId} className="text-sm font-medium">
            Scan type
          </label>
          <Select
            value={scanType}
            onValueChange={(value) => setScanType(value as CreateScanType)}
            disabled={isDisabled}
          >
            <SelectTrigger id={scanTypeId} className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="single_url">Specific URL</SelectItem>
                <SelectItem value="homepage">Homepage</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>Scan not created</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={isDisabled}>
          <Search className="size-4" aria-hidden="true" />
          {isSubmitting ? "Verifying..." : "Start scan"}
        </Button>
      </form>
    </div>
  );
}
