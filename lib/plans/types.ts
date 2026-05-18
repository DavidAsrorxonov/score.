export interface PlanLimits {
  dailyScanLimit: number | null;
  homepageScanEnabled: boolean;
  singleUrlScanEnabled: boolean;
  siteCrawlEnabled: boolean;
  competitorComparisonEnabled: boolean;
  pdfExportEnabled: boolean;
  maxPagesPerScan: number;
}
