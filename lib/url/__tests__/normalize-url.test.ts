import { describe, expect, it } from "vitest";

import { normalizeUrlInput } from "../normalize-url";

describe("normalizeUrlInput", () => {
  it.each([
    ["example.com", "https://example.com/"],
    ["www.example.com", "https://www.example.com/"],
    ["https://example.com", "https://example.com/"],
    ["http://example.com", "http://example.com/"],
    ["https://example.com/pricing", "https://example.com/pricing"],
    ["https://example.com/path?x=1", "https://example.com/path?x=1"],
    ["https://example.com/path#section", "https://example.com/path"],
    ["  EXAMPLE.com/pricing?utm_source=test#top  ", "https://example.com/pricing?utm_source=test"],
  ])("normalizes %s to %s", (input, expectedUrl) => {
    const result = normalizeUrlInput(input);

    expect(result).toMatchObject({
      ok: true,
      normalizedUrl: expectedUrl,
    });
  });

  it.each([
    ["", "EMPTY_INPUT"],
    ["   ", "EMPTY_INPUT"],
    ["not a url with spaces", "INVALID_URL"],
    ["ftp://example.com", "UNSUPPORTED_PROTOCOL"],
    ["file:///etc/passwd", "UNSUPPORTED_PROTOCOL"],
    ["javascript:alert(1)", "UNSUPPORTED_PROTOCOL"],
    ["https://user:pass@example.com", "CREDENTIALS_NOT_ALLOWED"],
  ])("rejects %s with %s", (input, expectedCode) => {
    const result = normalizeUrlInput(input);

    expect(result).toMatchObject({
      ok: false,
      code: expectedCode,
    });
  });

  it("rejects overly long inputs", () => {
    const result = normalizeUrlInput(`${"a".repeat(2049)}.com`);

    expect(result).toMatchObject({
      ok: false,
      code: "INPUT_TOO_LONG",
    });
  });
});
