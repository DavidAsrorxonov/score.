export const VERIFICATION_CONFIG = {
  timeoutMs: 10_000,
  maxRedirects: 5,
  maxResponseBytes: 2_000_000,
  userAgent: "score-SEO-Verifier/1.0",
  acceptedContentTypes: ["text/html", "application/xhtml+xml"],
} as const;
