import type { PageFetchErrorCode } from "./types";

export const PAGE_FETCH_MESSAGES = {
  INVALID_URL: "Enter a valid domain or URL.",
  UNSAFE_URL: "This URL cannot be fetched for security reasons.",
  DNS_FAILED: "This domain could not be resolved.",
  CONNECTION_FAILED: "The page could not be reached.",
  CONNECTION_TIMEOUT: "The page took too long to respond.",
  TOO_MANY_REDIRECTS: "The page redirects too many times.",
  UNSAFE_REDIRECT: "The page redirects to an unsafe target.",
  FETCH_BLOCKED: "The website blocked the fetch request.",
  NON_HTML_RESPONSE: "This URL does not return an HTML page.",
  RESPONSE_TOO_LARGE: "The page is too large to analyze safely.",
  UNSUPPORTED_STATUS_CODE:
    "The page returned a status code that cannot be analyzed.",
  SSL_ERROR: "The page's SSL connection could not be verified.",
  BODY_READ_FAILED: "The page response could not be read.",
  PAGE_FETCH_FAILED: "The page could not be fetched.",
} as const satisfies Record<PageFetchErrorCode, string>;

export function getPageFetchMessage(code: PageFetchErrorCode): string {
  return PAGE_FETCH_MESSAGES[code];
}
