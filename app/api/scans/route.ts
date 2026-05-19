import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createScanForCurrentUser } from "@/lib/scans/create-scan";
import { createScanFailure } from "@/lib/scans/errors";
import type { CreateScanType } from "@/lib/scans/types";

export const runtime = "nodejs";

const createScanSchema = z.object({
  input: z.string().trim().min(1).max(2048),
  scanType: z
    .enum(["homepage", "single_url", "site_crawl"])
    .default("single_url"),
});

function jsonFailure(code: Parameters<typeof createScanFailure>[0]) {
  const failure = createScanFailure(code);

  return Response.json(failure, { status: failure.status });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return jsonFailure("UNAUTHENTICATED");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonFailure("INVALID_REQUEST");
  }

  const parsedBody = createScanSchema.safeParse(body);

  if (!parsedBody.success) {
    return jsonFailure("INVALID_REQUEST");
  }

  if (parsedBody.data.scanType === "site_crawl") {
    return jsonFailure("UNSUPPORTED_SCAN_TYPE");
  }

  const result = await createScanForCurrentUser({
    input: parsedBody.data.input,
    scanType: parsedBody.data.scanType as CreateScanType,
  });

  return Response.json(result, { status: result.ok ? 201 : result.status });
}

