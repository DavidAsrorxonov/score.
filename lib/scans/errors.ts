import type { VerificationErrorCode } from "@/lib/verification";
import { getVerificationMessage } from "@/lib/verification";

import type { CreateScanErrorCode, CreateScanFailure } from "./types";

export const SCAN_CREATION_MESSAGES = {
  UNAUTHENTICATED: "Sign in to create a scan.",
  INVALID_REQUEST: "Enter a valid domain or URL.",
  UNSUPPORTED_SCAN_TYPE: "This scan type is not available yet.",
  DAILY_SCAN_LIMIT_REACHED:
    "You've used all 5 free scans for today. Your limit resets at midnight UTC.",
  TARGET_VERIFICATION_FAILED: "The website could not be verified.",
  QUEUE_ENQUEUE_FAILED:
    "The scan was created, but processing could not be started. Please try again later.",
  SCAN_CREATION_FAILED: "The scan could not be created. Please try again.",
} as const satisfies Partial<Record<CreateScanErrorCode, string>>;

export type WorkerScanErrorCode =
  | "SCAN_NOT_FOUND"
  | "INVALID_JOB_PAYLOAD"
  | "PROCESSING_NOT_IMPLEMENTED"
  | "SEO_EXTRACTION_NOT_IMPLEMENTED"
  | "SEO_EXTRACTION_FAILED"
  | "SEO_CHECKS_NOT_IMPLEMENTED"
  | "WORKER_PROCESSING_FAILED";

export const SCAN_PROCESSING_MESSAGES = {
  SCAN_NOT_FOUND: "The scan could not be found.",
  INVALID_JOB_PAYLOAD: "The scan job payload is invalid.",
  PROCESSING_NOT_IMPLEMENTED: "Scan processing is not implemented yet.",
  SEO_EXTRACTION_NOT_IMPLEMENTED: "SEO extraction is not implemented yet.",
  SEO_EXTRACTION_FAILED:
    "The page was fetched, but SEO data could not be extracted.",
  SEO_CHECKS_NOT_IMPLEMENTED: "SEO checks are not implemented yet.",
  WORKER_PROCESSING_FAILED: "The scan could not be processed.",
} as const satisfies Record<WorkerScanErrorCode, string>;

export function getScanProcessingMessage(code: WorkerScanErrorCode): string {
  return SCAN_PROCESSING_MESSAGES[code];
}

const VERIFICATION_ERROR_CODES = new Set<VerificationErrorCode>([
  "INVALID_URL",
  "UNSAFE_URL",
  "DNS_FAILED",
  "CONNECTION_FAILED",
  "CONNECTION_TIMEOUT",
  "TOO_MANY_REDIRECTS",
  "UNSAFE_REDIRECT",
  "FETCH_BLOCKED",
  "NON_HTML_RESPONSE",
  "RESPONSE_TOO_LARGE",
  "UNSUPPORTED_STATUS_CODE",
  "SSL_ERROR",
  "VERIFICATION_FAILED",
]);

export function isVerificationErrorCode(
  code: CreateScanErrorCode,
): code is VerificationErrorCode {
  return VERIFICATION_ERROR_CODES.has(code as VerificationErrorCode);
}

export function getCreateScanMessage(code: CreateScanErrorCode): string {
  if (isVerificationErrorCode(code)) {
    return getVerificationMessage(code);
  }

  return SCAN_CREATION_MESSAGES[code] ?? SCAN_CREATION_MESSAGES.INVALID_REQUEST;
}

export function getCreateScanStatus(code: CreateScanErrorCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "INVALID_REQUEST":
    case "INVALID_URL":
      return 400;
    case "UNSUPPORTED_SCAN_TYPE":
    case "UNSAFE_URL":
    case "UNSAFE_REDIRECT":
    case "FETCH_BLOCKED":
      return 403;
    case "DAILY_SCAN_LIMIT_REACHED":
      return 409;
    case "DNS_FAILED":
    case "CONNECTION_FAILED":
    case "CONNECTION_TIMEOUT":
    case "TOO_MANY_REDIRECTS":
    case "NON_HTML_RESPONSE":
    case "RESPONSE_TOO_LARGE":
    case "UNSUPPORTED_STATUS_CODE":
    case "SSL_ERROR":
    case "VERIFICATION_FAILED":
    case "TARGET_VERIFICATION_FAILED":
      return 422;
    case "QUEUE_ENQUEUE_FAILED":
      return 503;
    case "SCAN_CREATION_FAILED":
      return 500;
  }
}

export function createScanFailure(
  code: CreateScanErrorCode,
  message = getCreateScanMessage(code),
): CreateScanFailure {
  return {
    ok: false,
    code,
    message,
    status: getCreateScanStatus(code),
  };
}
