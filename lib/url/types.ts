export type UrlSafetyErrorCode =
  | "EMPTY_INPUT"
  | "INPUT_TOO_LONG"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "MISSING_HOSTNAME"
  | "CREDENTIALS_NOT_ALLOWED"
  | "LOCALHOST_NOT_ALLOWED"
  | "INTERNAL_HOSTNAME_NOT_ALLOWED"
  | "IP_ADDRESS_NOT_ALLOWED"
  | "DNS_RESOLUTION_FAILED"
  | "DNS_RESOLVES_TO_PRIVATE_IP"
  | "UNSAFE_REDIRECT_TARGET";

export type NormalizedUrlResult =
  | {
      ok: true;
      input: string;
      normalizedUrl: string;
      protocol: "http:" | "https:";
      hostname: string;
      port: string;
      pathname: string;
      search: string;
    }
  | {
      ok: false;
      input: string;
      code: UrlSafetyErrorCode;
      message: string;
    };

export type UrlSafetyResult =
  | {
      ok: true;
      normalizedUrl: string;
      hostname: string;
      resolvedIps: string[];
    }
  | {
      ok: false;
      normalizedUrl?: string;
      hostname?: string;
      code: UrlSafetyErrorCode;
      message: string;
      resolvedIps?: string[];
    };

export type HostnameResolver = (hostname: string) => Promise<string[]>;
