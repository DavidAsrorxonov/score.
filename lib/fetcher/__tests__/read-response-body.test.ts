import { describe, expect, it } from "vitest";

import { readResponseBodyWithLimit } from "../read-response-body";

describe("readResponseBodyWithLimit", () => {
  it("rejects oversized content-length before reading", async () => {
    const response = new Response("small body", {
      headers: {
        "content-length": "100",
      },
    });

    const result = await readResponseBodyWithLimit(response, 10);

    expect(result).toEqual({
      ok: false,
      code: "RESPONSE_TOO_LARGE",
      message: "The page is too large to analyze safely.",
      sizeBytes: 100,
    });
  });

  it("rejects bodies that exceed the streaming byte limit", async () => {
    const response = new Response("0123456789abcdef");

    const result = await readResponseBodyWithLimit(response, 10);

    expect(result).toMatchObject({
      ok: false,
      code: "RESPONSE_TOO_LARGE",
      sizeBytes: 16,
    });
  });

  it("returns bounded body bytes", async () => {
    const response = new Response("hello");

    const result = await readResponseBodyWithLimit(response, 10);

    expect(result).toMatchObject({
      ok: true,
      sizeBytes: 5,
    });

    if (result.ok) {
      expect(new TextDecoder().decode(result.bytes)).toBe("hello");
    }
  });
});
