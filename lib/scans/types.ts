import type { ScanStatus, ScanType } from "@/lib/db/types";
import type { VerificationErrorCode } from "@/lib/verification";

export type CreateScanType = Extract<ScanType, "homepage" | "single_url">;

export interface CreateScanInput {
  input: string;
  scanType: CreateScanType;
}

export interface CreateScanSuccess {
  ok: true;
  scan: {
    id: string;
    status: Extract<ScanStatus, "queued">;
    inputUrl: string;
    normalizedUrl: string;
    finalUrl: string;
    scanType: CreateScanType;
  };
}

export type CreateScanErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_SCAN_TYPE"
  | "DAILY_SCAN_LIMIT_REACHED"
  | "TARGET_VERIFICATION_FAILED"
  | "SCAN_CREATION_FAILED"
  | VerificationErrorCode;

export interface CreateScanFailure {
  ok: false;
  code: CreateScanErrorCode;
  message: string;
  status?: number;
}

export type CreateScanResult = CreateScanSuccess | CreateScanFailure;

