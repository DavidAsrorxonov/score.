import type { VerificationErrorCode } from "./types";

export const VERIFICATION_MESSAGES = {
  INVALID_URL: "Enter a valid domain or URL.",
  UNSAFE_URL: "This URL cannot be analyzed for security reasons.",
  DNS_FAILED: "This domain could not be resolved.",
  CONNECTION_FAILED: "The website could not be reached.",
  CONNECTION_TIMEOUT: "The website took too long to respond.",
  TOO_MANY_REDIRECTS: "The website redirects too many times.",
  UNSAFE_REDIRECT: "The website redirects to an unsafe target.",
  FETCH_BLOCKED: "The website blocked the verification request.",
  NON_HTML_RESPONSE: "This URL does not appear to return an HTML page.",
  RESPONSE_TOO_LARGE: "The response is too large to verify safely.",
  UNSUPPORTED_STATUS_CODE:
    "The website returned a status code that cannot be analyzed.",
  SSL_ERROR: "The website's SSL connection could not be verified.",
  VERIFICATION_FAILED: "The website could not be verified.",
} as const satisfies Record<VerificationErrorCode, string>;

export function getVerificationMessage(code: VerificationErrorCode): string {
  return VERIFICATION_MESSAGES[code];
}
