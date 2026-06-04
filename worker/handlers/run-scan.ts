import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import { z } from "zod";

import { db } from "@/lib/db";
import { scanPages, scans } from "@/lib/db/schema";
import type { Scan, ScanStatus } from "@/lib/db/types";
import {
  fetchPageHtml,
  type FetchPageResult,
  type FetchPageSuccess,
} from "@/lib/fetcher";
import type { RunScanJobData } from "@/lib/queue";
import {
  getScanProcessingMessage,
  type WorkerScanErrorCode,
} from "@/lib/scans/errors";
import { markScanFailed, updateScanStatus } from "@/lib/scans/status";
import {
  extractPageSeo,
  persistPageExtraction,
  type ExtractedPageSeo,
} from "@/lib/seo";

const runScanJobSchema = z.object({
  scanId: z.string().trim().min(1),
});

const ACTIVE_SCAN_STATUSES = new Set<ScanStatus>([
  "queued",
  "validating",
  "fetching",
  "analyzing",
  "generating_report",
  "generating_pdf",
]);

type LoadedScan = Pick<Scan, "id" | "status" | "inputUrl" | "normalizedUrl">;

interface RunScanJobDependencies {
  loadScan?: (scanId: string) => Promise<LoadedScan | null>;
  updateStatus?: typeof updateScanStatus;
  failScan?: typeof markScanFailed;
  fetchPage?: (inputUrl: string) => Promise<FetchPageResult>;
  saveFetchedPage?: (
    scanId: string,
    fetchResult: FetchPageSuccess,
  ) => Promise<{ pageId?: string }>;
  extractSeo?: typeof extractPageSeo;
  saveExtraction?: typeof persistPageExtraction;
}

interface RunScanJobResult {
  scanId: string;
  action: "processed" | "skipped";
  status: ScanStatus;
}

async function loadScanById(scanId: string): Promise<LoadedScan | null> {
  const [scan] = await db
    .select({
      id: scans.id,
      status: scans.status,
      inputUrl: scans.inputUrl,
      normalizedUrl: scans.normalizedUrl,
    })
    .from(scans)
    .where(eq(scans.id, scanId))
    .limit(1);

  return scan ?? null;
}

function createWorkerError(code: WorkerScanErrorCode, detail?: string) {
  return new Error(detail ? `${code}: ${detail}` : code);
}

async function markUnexpectedFailure(
  scanId: string,
  error: unknown,
  failScan: typeof markScanFailed,
) {
  try {
    await failScan({
      scanId,
      errorCode: "WORKER_PROCESSING_FAILED",
      errorMessage: getScanProcessingMessage("WORKER_PROCESSING_FAILED"),
      metadata: {
        reason: error instanceof Error ? error.message : "Unknown worker error",
      },
    });
  } catch (failureError) {
    console.error("Failed to mark scan worker error", failureError);
  }
}

async function saveFetchedScanPageMetadata(
  scanId: string,
  fetchResult: FetchPageSuccess,
): Promise<{ pageId?: string }> {
  const now = new Date();

  const [page] = await db
    .insert(scanPages)
    .values({
      scanId,
      url: fetchResult.normalizedUrl,
      finalUrl: fetchResult.finalUrl,
      statusCode: fetchResult.statusCode,
      contentType: fetchResult.contentType,
      responseTimeMs: fetchResult.responseTimeMs,
      pageSizeBytes: fetchResult.pageSizeBytes,
      technicalData: {
        inputUrl: fetchResult.inputUrl,
        normalizedUrl: fetchResult.normalizedUrl,
        finalUrl: fetchResult.finalUrl,
        hostname: fetchResult.hostname,
        resolvedIps: fetchResult.resolvedIps,
        statusCode: fetchResult.statusCode,
        contentType: fetchResult.contentType,
        contentLengthBytes: fetchResult.contentLengthBytes,
        responseTimeMs: fetchResult.responseTimeMs,
        pageSizeBytes: fetchResult.pageSizeBytes,
        redirectChain: fetchResult.redirectChain,
        fetchedAt: fetchResult.fetchedAt.toISOString(),
      },
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [scanPages.scanId, scanPages.url],
      set: {
        finalUrl: fetchResult.finalUrl,
        statusCode: fetchResult.statusCode,
        contentType: fetchResult.contentType,
        responseTimeMs: fetchResult.responseTimeMs,
        pageSizeBytes: fetchResult.pageSizeBytes,
        technicalData: {
          inputUrl: fetchResult.inputUrl,
          normalizedUrl: fetchResult.normalizedUrl,
          finalUrl: fetchResult.finalUrl,
          hostname: fetchResult.hostname,
          resolvedIps: fetchResult.resolvedIps,
          statusCode: fetchResult.statusCode,
          contentType: fetchResult.contentType,
          contentLengthBytes: fetchResult.contentLengthBytes,
          responseTimeMs: fetchResult.responseTimeMs,
          pageSizeBytes: fetchResult.pageSizeBytes,
          redirectChain: fetchResult.redirectChain,
          fetchedAt: fetchResult.fetchedAt.toISOString(),
        },
        updatedAt: now,
      },
    })
    .returning({ id: scanPages.id });

  return {
    pageId: page?.id,
  };
}

function getScanFetchInput(scan: LoadedScan): string {
  return scan.normalizedUrl ?? scan.inputUrl;
}

function removeUndefinedValues(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  );
}

function buildFetchFailureMetadata(
  fetchResult: Extract<FetchPageResult, { ok: false }>,
) {
  return removeUndefinedValues({
    normalizedUrl: fetchResult.normalizedUrl,
    finalUrl: fetchResult.finalUrl,
    hostname: fetchResult.hostname,
    resolvedIps: fetchResult.resolvedIps,
    statusCode: fetchResult.statusCode,
    contentType: fetchResult.contentType,
    contentLengthBytes: fetchResult.contentLengthBytes,
    responseTimeMs: fetchResult.responseTimeMs,
    pageSizeBytes: fetchResult.pageSizeBytes,
    redirectChain: fetchResult.redirectChain,
    fetchedAt: fetchResult.fetchedAt.toISOString(),
  });
}

function buildFetchSuccessMetadata(fetchResult: FetchPageSuccess) {
  return {
    finalUrl: fetchResult.finalUrl,
    statusCode: fetchResult.statusCode,
    contentType: fetchResult.contentType,
    contentLengthBytes: fetchResult.contentLengthBytes,
    responseTimeMs: fetchResult.responseTimeMs,
    pageSizeBytes: fetchResult.pageSizeBytes,
    redirectCount: fetchResult.redirectChain.length,
    fetchedAt: fetchResult.fetchedAt.toISOString(),
  };
}

function buildExtractionSuccessMetadata(extraction: ExtractedPageSeo) {
  return {
    title: extraction.title,
    metaDescriptionPresent: extraction.metaDescription !== null,
    canonicalUrl: extraction.canonicalUrl,
    h1Count: extraction.h1.length,
    headingCount: extraction.headings.length,
    internalLinkCount: extraction.internalLinks.length,
    externalLinkCount: extraction.externalLinks.length,
    imageCount: extraction.images.length,
    imagesMissingAltCount: extraction.imagesMissingAltCount,
    schemaTypes: extraction.schemaTypes,
    wordCount: extraction.wordCount,
  };
}

export async function handleRunScanJob(
  job: Job<unknown>,
  dependencies: RunScanJobDependencies = {},
): Promise<RunScanJobResult> {
  const parsed = runScanJobSchema.safeParse(job.data);

  if (!parsed.success) {
    throw createWorkerError(
      "INVALID_JOB_PAYLOAD",
      "scan.run jobs require a non-empty scanId.",
    );
  }

  const scanId = parsed.data.scanId;
  const loadScan = dependencies.loadScan ?? loadScanById;
  const updateStatus = dependencies.updateStatus ?? updateScanStatus;
  const failScan = dependencies.failScan ?? markScanFailed;
  const fetchPage = dependencies.fetchPage ?? fetchPageHtml;
  const saveFetchedPage =
    dependencies.saveFetchedPage ?? saveFetchedScanPageMetadata;
  const extractSeo = dependencies.extractSeo ?? extractPageSeo;
  const saveExtraction = dependencies.saveExtraction ?? persistPageExtraction;

  try {
    const scan = await loadScan(scanId);

    if (!scan) {
      throw createWorkerError("SCAN_NOT_FOUND", `scanId=${scanId}`);
    }

    if (scan.status === "completed" || scan.status === "failed") {
      return {
        scanId,
        action: "skipped",
        status: scan.status,
      };
    }

    if (!ACTIVE_SCAN_STATUSES.has(scan.status)) {
      throw createWorkerError(
        "WORKER_PROCESSING_FAILED",
        `Unsupported scan status: ${scan.status}`,
      );
    }

    if (scan.status === "queued") {
      await updateStatus({
        scanId,
        status: "validating",
        message: "Worker picked up scan job.",
        metadata: {
          jobId: job.id,
          jobName: job.name,
        },
      });
    }

    if (scan.status === "queued" || scan.status === "validating") {
      await updateStatus({
        scanId,
        status: "fetching",
        message: "Worker started fetching the page HTML.",
        metadata: {
          jobId: job.id,
          jobName: job.name,
        },
      });
    }

    if (
      scan.status === "queued" ||
      scan.status === "validating" ||
      scan.status === "fetching"
    ) {
      const fetchResult = await fetchPage(getScanFetchInput(scan));

      if (!fetchResult.ok) {
        await failScan({
          scanId,
          errorCode: fetchResult.code,
          errorMessage: fetchResult.message,
          metadata: {
            jobId: job.id,
            jobName: job.name,
            fetch: buildFetchFailureMetadata(fetchResult),
          },
        });

        return {
          scanId,
          action: "processed",
          status: "failed",
        };
      }

      const fetchedPage = await saveFetchedPage(scanId, fetchResult);

      await updateStatus({
        scanId,
        status: "analyzing",
        message: "Page HTML fetched; SEO extraction started.",
        metadata: {
          jobId: job.id,
          jobName: job.name,
          fetch: buildFetchSuccessMetadata(fetchResult),
        },
      });

      try {
        const extraction = extractSeo({
          html: fetchResult.html,
          url: fetchResult.normalizedUrl,
          finalUrl: fetchResult.finalUrl,
        });

        await saveExtraction({
          scanId,
          pageId: fetchedPage.pageId,
          extraction,
        });

        await updateStatus({
          scanId,
          status: "analyzing",
          message: "SEO facts extracted; SEO checks are the next processing step.",
          metadata: {
            jobId: job.id,
            jobName: job.name,
            extraction: buildExtractionSuccessMetadata(extraction),
          },
        });
      } catch (error) {
        await failScan({
          scanId,
          errorCode: "SEO_EXTRACTION_FAILED",
          errorMessage: getScanProcessingMessage("SEO_EXTRACTION_FAILED"),
          metadata: {
            jobId: job.id,
            jobName: job.name,
            reason:
              error instanceof Error ? error.message : "Unknown extraction error",
          },
        });

        return {
          scanId,
          action: "processed",
          status: "failed",
        };
      }
    }

    await failScan({
      scanId,
      errorCode: "SEO_CHECKS_NOT_IMPLEMENTED",
      errorMessage: getScanProcessingMessage("SEO_CHECKS_NOT_IMPLEMENTED"),
      metadata: {
        jobId: job.id,
        jobName: job.name,
      },
    });

    return {
      scanId,
      action: "processed",
      status: "failed",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("INVALID_JOB_PAYLOAD") ||
        error.message.startsWith("SCAN_NOT_FOUND"))
    ) {
      throw error;
    }

    await markUnexpectedFailure(scanId, error, failScan);
    throw error;
  }
}

export type { RunScanJobData };
