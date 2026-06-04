export const PAGE_FETCHER_CONFIG = {
  timeoutMs: 15000,
  maxRedirects: 5,
  maxResponseBytes: 5_000_000,
  userAgent: "score-SEO-Fetcher/1.0",
  acceptedContentTypes: ["text/html", "application/xhtml+xml"],
} as const;
