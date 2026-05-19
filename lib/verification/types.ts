export type VerificationErrorCode =
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
  | "VERIFICATION_FAILED";

export interface RedirectHop {
  fromUrl: string;
  toUrl: string;
  statusCode: number;
}

export interface VerificationSuccess {
  ok: true;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  hostname: string;
  resolvedIps: string[];
  statusCode: number;
  contentType: string | null;
  responseTimeMs: number;
  contentLengthBytes: number | null;
  redirectChain: RedirectHop[];
  verifiedAt: Date;
}

export interface VerificationFailure {
  ok: false;
  inputUrl: string;
  normalizedUrl?: string;
  finalUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
  statusCode?: number;
  contentType?: string | null;
  responseTimeMs?: number;
  redirectChain?: RedirectHop[];
  code: VerificationErrorCode;
  message: string;
  verifiedAt: Date;
}

export type VerificationResult = VerificationSuccess | VerificationFailure;

export interface VerificationHttpResponse {
  statusCode: number;
  headers: Headers;
  responseTimeMs: number;
}
