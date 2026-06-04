import { describe, expect, it, vi } from "vitest";

import { fetchPageHtml } from "../fetch-page-html";
import type { HostnameResolver } from "../../url/types";

function createResolver(records: Record<string, string[]>): HostnameResolver {
  return async (hostname: string) => {
    const ips = records[hostname];

    if (!ips) {
      throw new Error("DNS resolution failed");
    }

    return ips;
  };
}

function createFetch(responses: Record<string, Response>): typeof fetch {
  return vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    const response = responses[url];

    if (!response) {
      throw new TypeError("fetch failed");
    }

    return response;
  });
}

const publicResolver = createResolver({
  "example.com": ["93.184.216.34"],
  "www.example.com": ["93.184.216.34"],
  "private.example.com": ["192.168.1.10"],
});

describe("fetchPageHtml", () => {
  it("normalizes and fetches an HTML page without using raw input", async () => {
    const fetchFn = createFetch({
      "https://example.com/": new Response("<html>Hello</html>", {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-length": "18",
        },
      }),
    });

    const result = await fetchPageHtml("example.com", {
      fetchFn,
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: true,
      inputUrl: "example.com",
      normalizedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      hostname: "example.com",
      resolvedIps: ["93.184.216.34"],
      statusCode: 200,
      contentType: "text/html; charset=utf-8",
      contentLengthBytes: 18,
      pageSizeBytes: 18,
      redirectChain: [],
      html: "<html>Hello</html>",
    });
    expect(fetchFn).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({
        method: "GET",
        redirect: "manual",
      }),
    );
    expect(fetchFn).not.toHaveBeenCalledWith("example.com", expect.anything());
  });

  it("follows safe redirects manually and records the chain", async () => {
    const fetchFn = createFetch({
      "https://example.com/": new Response(null, {
        status: 301,
        headers: {
          location: "/home",
        },
      }),
      "https://example.com/home": new Response("<html>Home</html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
        },
      }),
    });

    const result = await fetchPageHtml("https://example.com", {
      fetchFn,
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: true,
      finalUrl: "https://example.com/home",
      redirectChain: [
        {
          fromUrl: "https://example.com/",
          toUrl: "https://example.com/home",
          statusCode: 301,
        },
      ],
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("rejects unsafe URLs before fetching", async () => {
    const fetchFn = vi.fn<typeof fetch>();

    const result = await fetchPageHtml("http://localhost", {
      fetchFn,
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "UNSAFE_URL",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("rejects unsafe redirects", async () => {
    const fetchFn = createFetch({
      "https://example.com/": new Response(null, {
        status: 302,
        headers: {
          location: "https://private.example.com/",
        },
      }),
    });

    const result = await fetchPageHtml("https://example.com", {
      fetchFn,
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "UNSAFE_REDIRECT",
      finalUrl: "https://example.com/",
      statusCode: 302,
      redirectChain: [],
    });
  });

  it("rejects non-HTML responses", async () => {
    const result = await fetchPageHtml("https://example.com", {
      fetchFn: createFetch({
        "https://example.com/": new Response('{"ok":true}', {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      }),
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "NON_HTML_RESPONSE",
      contentType: "application/json",
    });
  });

  it("maps blocked status codes", async () => {
    const result = await fetchPageHtml("https://example.com", {
      fetchFn: createFetch({
        "https://example.com/": new Response("blocked", {
          status: 403,
          headers: {
            "content-type": "text/html",
          },
        }),
      }),
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "FETCH_BLOCKED",
      statusCode: 403,
    });
  });

  it("rejects oversized HTML bodies", async () => {
    const result = await fetchPageHtml("https://example.com", {
      fetchFn: createFetch({
        "https://example.com/": new Response("0123456789", {
          status: 200,
          headers: {
            "content-type": "text/html",
            "content-length": "5000001",
          },
        }),
      }),
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "RESPONSE_TOO_LARGE",
      contentLengthBytes: 5000001,
    });
  });

  it("maps aborts to timeout failures", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    const result = await fetchPageHtml("https://example.com", {
      fetchFn,
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "CONNECTION_TIMEOUT",
    });
  });
});
