import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { extractLinks } from "../extract-links";

describe("extractLinks", () => {
  it("resolves links and classifies internal, external, and nofollow links", () => {
    const $ = load(`
      <a href="/pricing">Pricing</a>
      <a href="https://example.com/about" rel="nofollow sponsored" target="_blank">About us</a>
      <a href="https://other.com/page">Other</a>
      <a href="#section">Section</a>
      <a href="mailto:sales@example.com">Email</a>
      <a href="tel:+15555550100">Call</a>
      <a href="javascript:void(0)">Script</a>
      <a href="data:text/plain,test">Data</a>
      <a>No href</a>
    `);

    const links = extractLinks($, "https://example.com/base/page");

    expect(links).toEqual([
      {
        href: "https://example.com/pricing",
        text: "Pricing",
        rel: [],
        target: null,
        isInternal: true,
        isExternal: false,
        isNofollow: false,
      },
      {
        href: "https://example.com/about",
        text: "About us",
        rel: ["nofollow", "sponsored"],
        target: "_blank",
        isInternal: true,
        isExternal: false,
        isNofollow: true,
      },
      {
        href: "https://other.com/page",
        text: "Other",
        rel: [],
        target: null,
        isInternal: false,
        isExternal: true,
        isNofollow: false,
      },
    ]);
  });

  it("normalizes repeated whitespace in anchor text", () => {
    const $ = load('<a href="/docs"> Read   the docs </a>');

    const [link] = extractLinks($, "https://example.com/");

    expect(link?.text).toBe("Read the docs");
  });
});
