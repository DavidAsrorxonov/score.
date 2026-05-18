import type { UrlSafetyErrorCode } from "./types";

export const URL_SAFETY_MESSAGES = {
  EMPTY_INPUT: "Enter a domain or URL to analyze.",
  INPUT_TOO_LONG: "The URL is too long to analyze.",
  INVALID_URL: "Enter a valid domain or URL.",
  UNSUPPORTED_PROTOCOL: "Only HTTP and HTTPS URLs are supported.",
  MISSING_HOSTNAME: "Enter a URL with a valid hostname.",
  CREDENTIALS_NOT_ALLOWED:
    "URLs with embedded usernames or passwords are not supported.",
  LOCALHOST_NOT_ALLOWED: "Localhost URLs cannot be analyzed.",
  INTERNAL_HOSTNAME_NOT_ALLOWED: "Internal hostnames cannot be analyzed.",
  IP_ADDRESS_NOT_ALLOWED: "Direct IP address targets are not supported.",
  DNS_RESOLUTION_FAILED: "This domain could not be resolved.",
  DNS_RESOLVES_TO_PRIVATE_IP:
    "This domain resolves to a private or internal network address.",
  UNSAFE_REDIRECT_TARGET: "The URL redirects to an unsafe target.",
} as const satisfies Record<UrlSafetyErrorCode, string>;

export function getUrlSafetyMessage(code: UrlSafetyErrorCode): string {
  return URL_SAFETY_MESSAGES[code];
}
