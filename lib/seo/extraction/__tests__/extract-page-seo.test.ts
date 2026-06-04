import { describe, expect, it } from "vitest";

import { extractPageSeo } from "../extract-page-seo";

describe("extractPageSeo", () => {
  it("extracts metadata, headings, images, social tags, and text facts", () => {
    const extraction = extractPageSeo({
      url: "https://example.com/pricing",
      finalUrl: "https://example.com/pricing",
      html: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="description" content="  Clear pricing for teams. ">
            <meta name="robots" content="index,follow">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta property="og:title" content="Pricing">
            <meta property="og:description" content="Pricing plans">
            <meta name="twitter:card" content="summary_large_image">
            <link rel="canonical" href="/pricing">
            <title> Pricing | Example </title>
            <script>window.bad = true;</script>
            <style>body { color: red; }</style>
          </head>
          <body>
            <h1> Pricing </h1>
            <h2> Plans </h2>
            <h3> Frequently   asked questions </h3>
            <h4> Details </h4>
            <h2> </h2>
            <p>Simple words for real customers.</p>
            <img src="/logo.png" alt=" Company logo " title="Logo" width="120" height="40" loading="lazy">
            <img src="decorative.png" alt="">
            <noscript>This should not count.</noscript>
          </body>
        </html>
      `,
    });

    expect(extraction.title).toBe("Pricing | Example");
    expect(extraction.metaDescription).toBe("Clear pricing for teams.");
    expect(extraction.metaRobots).toBe("index,follow");
    expect(extraction.canonicalUrl).toBe("https://example.com/pricing");
    expect(extraction.htmlLang).toBe("en");
    expect(extraction.charset).toBe("utf-8");
    expect(extraction.viewport).toBe("width=device-width, initial-scale=1");
    expect(extraction.openGraph).toEqual({
      "og:title": "Pricing",
      "og:description": "Pricing plans",
    });
    expect(extraction.twitterCard).toEqual({
      "twitter:card": "summary_large_image",
    });
    expect(extraction.headings).toEqual([
      { level: 1, text: "Pricing" },
      { level: 2, text: "Plans" },
      { level: 3, text: "Frequently asked questions" },
      { level: 4, text: "Details" },
    ]);
    expect(extraction.h1).toEqual(["Pricing"]);
    expect(extraction.h2).toEqual(["Plans"]);
    expect(extraction.h3).toEqual(["Frequently asked questions"]);
    expect(extraction.images).toEqual([
      {
        src: "https://example.com/logo.png",
        alt: "Company logo",
        title: "Logo",
        width: "120",
        height: "40",
        loading: "lazy",
        hasAlt: true,
      },
      {
        src: "https://example.com/decorative.png",
        alt: null,
        title: null,
        width: null,
        height: null,
        loading: null,
        hasAlt: false,
      },
    ]);
    expect(extraction.imagesMissingAltCount).toBe(1);
    expect(extraction.wordCount).toBe(11);
    expect(extraction.textSample).toContain("Pricing Plans");
    expect(extraction.textSample).not.toContain("window.bad");
    expect(extraction.textSample).not.toContain("This should not count");
  });

  it("returns nulls and empty collections for missing fields", () => {
    const extraction = extractPageSeo({
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      html: "<html><body></body></html>",
    });

    expect(extraction.title).toBeNull();
    expect(extraction.metaDescription).toBeNull();
    expect(extraction.metaRobots).toBeNull();
    expect(extraction.canonicalUrl).toBeNull();
    expect(extraction.htmlLang).toBeNull();
    expect(extraction.charset).toBeNull();
    expect(extraction.viewport).toBeNull();
    expect(extraction.headings).toEqual([]);
    expect(extraction.links).toEqual([]);
    expect(extraction.images).toEqual([]);
    expect(extraction.openGraph).toEqual({});
    expect(extraction.twitterCard).toEqual({});
    expect(extraction.structuredData).toEqual([]);
    expect(extraction.wordCount).toBe(0);
    expect(extraction.textSample).toBe("");
  });

  it("handles malformed HTML without throwing", () => {
    const extraction = extractPageSeo({
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      html: "<html><head><title>Broken</title><body><h1>Still parsed",
    });

    expect(extraction.title).toContain("Broken");
    expect(extraction.h1).toEqual(["Still parsed"]);
  });

  it("bounds the text sample", () => {
    const longText = Array.from({ length: 500 }, (_, index) => `word${index}`)
      .join(" ");

    const extraction = extractPageSeo({
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      html: `<html><body>${longText}</body></html>`,
    });

    expect(extraction.wordCount).toBe(500);
    expect(extraction.textSample).toHaveLength(2_000);
  });
});
