import { performance } from "node:perf_hooks";

import { VERIFICATION_CONFIG } from "./config";
import type { VerificationErrorCode, VerificationHttpResponse } from "./types";

type FetchFunction = typeof fetch;

interface RequestForVerificationOptions {
  fetchFn?: FetchFunction;
}

export class VerificationRequestError extends Error {
  code: VerificationErrorCode;

  constructor(code: VerificationErrorCode) {
    super(code);
    this.name = "VerificationRequestError";
    this.code = code;
  }
}

function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.name;
  }

  return undefined;
}

function stringifyUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      typeof error.cause === "object" && error.cause !== null
        ? JSON.stringify(error.cause)
        : "";

    return `${error.name} ${error.message} ${cause}`;
  }

  return String(error);
}

function isSslError(error: unknown): boolean {
  const errorText = stringifyUnknownError(error).toLowerCase();

  return (
    errorText.includes("ssl") ||
    errorText.includes("tls") ||
    errorText.includes("cert") ||
    errorText.includes("certificate")
  );
}

export async function requestForVerification(
  url: string,
  options: RequestForVerificationOptions = {},
): Promise<VerificationHttpResponse> {
  const fetchFn = options.fetchFn ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, VERIFICATION_CONFIG.timeoutMs);
  const start = performance.now();

  try {
    const response = await fetchFn(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": VERIFICATION_CONFIG.userAgent,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });

    return {
      statusCode: response.status,
      headers: response.headers,
      responseTimeMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    if (controller.signal.aborted || getErrorName(error) === "AbortError") {
      throw new VerificationRequestError("CONNECTION_TIMEOUT");
    }

    if (isSslError(error)) {
      throw new VerificationRequestError("SSL_ERROR");
    }

    throw new VerificationRequestError("CONNECTION_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}
