import { getUrlSafetyMessage } from "./errors";
import { normalizeUrlInput } from "./normalize-url";
import { validateUrlSafety } from "./validate-url-safety";
import type { HostnameResolver, UrlSafetyResult } from "./types";

interface ValidateRedirectUrlOptions {
  resolveHostname?: HostnameResolver;
}

function unsafeRedirectFailure(): UrlSafetyResult {
  return {
    ok: false,
    code: "UNSAFE_REDIRECT_TARGET",
    message: getUrlSafetyMessage("UNSAFE_REDIRECT_TARGET"),
  };
}

export async function validateRedirectUrl(
  params: {
    fromUrl: string;
    location: string;
  },
  options: ValidateRedirectUrlOptions = {},
): Promise<UrlSafetyResult> {
  const normalizedFromUrl = normalizeUrlInput(params.fromUrl);

  if (!normalizedFromUrl.ok) {
    return unsafeRedirectFailure();
  }

  let redirectTarget: URL;

  try {
    redirectTarget = new URL(params.location, normalizedFromUrl.normalizedUrl);
  } catch {
    return unsafeRedirectFailure();
  }

  return validateUrlSafety(redirectTarget.toString(), {
    resolveHostname: options.resolveHostname,
  });
}
