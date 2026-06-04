import type { HostnameResolver } from "@/lib/url/types";

export type PageFetchErrorCode =
  | "INVALID_URL"
  | "UNSAFE_URL"
  | "DNS_FAILED"
  | "CONNECTION_FAILED"
  | "CONNECTION_TIMEOUT"
  | "TOO_MANY_REDIRECTS"
  | "UNSAFE_REDIRECT"
  | "FETCH_BLOCKED"
  | "NON_HTML_RESPONSE"
  | "RESPONSE_TOO_LARGE"
  | "UNSUPPORTED_STATUS_CODE"
  | "SSL_ERROR"
  | "BODY_READ_FAILED"
  | "PAGE_FETCH_FAILED";

export interface FetchRedirectHop {
  fromUrl: string;
  toUrl: string;
  statusCode: number;
}

export interface FetchPageSuccess {
  ok: true;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  hostname: string;
  resolvedIps: string[];
  statusCode: number;
  contentType: string;
  contentLengthBytes: number | null;
  responseTimeMs: number;
  pageSizeBytes: number;
  redirectChain: FetchRedirectHop[];
  html: string;
  fetchedAt: Date;
}

export interface FetchPageFailure {
  ok: false;
  inputUrl: string;
  normalizedUrl?: string;
  finalUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
  statusCode?: number;
  contentType?: string | null;
  contentLengthBytes?: number | null;
  responseTimeMs?: number;
  pageSizeBytes?: number;
  redirectChain?: FetchRedirectHop[];
  code: PageFetchErrorCode;
  message: string;
  fetchedAt: Date;
}

export type FetchPageResult = FetchPageSuccess | FetchPageFailure;

export type FetchFunction = typeof fetch;

export interface FetchPageHtmlOptions {
  fetchFn?: FetchFunction;
  resolveHostname?: HostnameResolver;
}

export type ReadResponseBodyResult =
  | {
      ok: true;
      bytes: Uint8Array;
      sizeBytes: number;
    }
  | {
      ok: false;
      code: "RESPONSE_TOO_LARGE" | "BODY_READ_FAILED";
      message: string;
      sizeBytes?: number;
    };
