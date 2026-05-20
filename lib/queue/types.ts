export interface RunScanJobData {
  scanId: string;
}

export interface GenerateReportJobData {
  scanId: string;
}

export interface GeneratePdfJobData {
  scanId: string;
  pdfExportId?: string;
}

export type QueueJobData =
  | RunScanJobData
  | GenerateReportJobData
  | GeneratePdfJobData;

export interface QueueHealth {
  ok: boolean;
  message: string;
}
