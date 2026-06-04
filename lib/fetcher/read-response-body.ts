import { getPageFetchMessage } from "./errors";
import type { ReadResponseBodyResult } from "./types";

function parseContentLength(headers: Headers): number | null {
  const contentLength = headers.get("content-length");

  if (contentLength === null) {
    return null;
  }

  const parsedContentLength = Number.parseInt(contentLength, 10);

  if (!Number.isFinite(parsedContentLength) || parsedContentLength < 0) {
    return null;
  }

  return parsedContentLength;
}

function combineChunks(chunks: Uint8Array[], sizeBytes: number): Uint8Array {
  const bytes = new Uint8Array(sizeBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

export async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<ReadResponseBodyResult> {
  const contentLengthBytes = parseContentLength(response.headers);

  if (contentLengthBytes !== null && contentLengthBytes > maxBytes) {
    return {
      ok: false,
      code: "RESPONSE_TOO_LARGE",
      message: getPageFetchMessage("RESPONSE_TOO_LARGE"),
      sizeBytes: contentLengthBytes,
    };
  }

  if (response.body === null) {
    return {
      ok: true,
      bytes: new Uint8Array(),
      sizeBytes: 0,
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let sizeBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return {
          ok: true,
          bytes: combineChunks(chunks, sizeBytes),
          sizeBytes,
        };
      }

      if (value === undefined) {
        continue;
      }

      sizeBytes += value.byteLength;

      if (sizeBytes > maxBytes) {
        await reader.cancel();

        return {
          ok: false,
          code: "RESPONSE_TOO_LARGE",
          message: getPageFetchMessage("RESPONSE_TOO_LARGE"),
          sizeBytes,
        };
      }

      chunks.push(value);
    }
  } catch {
    return {
      ok: false,
      code: "BODY_READ_FAILED",
      message: getPageFetchMessage("BODY_READ_FAILED"),
      sizeBytes,
    };
  }
}
