import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import {
  extractSchemaTypesFromJsonLd,
  extractStructuredData,
} from "../extract-structured-data";

describe("extractStructuredData", () => {
  it("parses JSON-LD and extracts schema types from common shapes", () => {
    const $ = load(`
      <script type="application/ld+json">
        { "@type": "Organization", "name": "Example" }
      </script>
      <script type="application/ld+json">
        { "@type": ["Product", "Thing"] }
      </script>
      <script type="application/ld+json">
        {
          "@graph": [
            { "@type": "WebSite" },
            { "@type": "Organization" }
          ]
        }
      </script>
    `);

    const blocks = extractStructuredData($);

    expect(blocks).toHaveLength(3);
    expect(blocks.flatMap((block) => block.schemaTypes)).toEqual([
      "Organization",
      "Product",
      "Thing",
      "WebSite",
      "Organization",
    ]);
    expect(
      extractSchemaTypesFromJsonLd(blocks.map((block) => block.parsed)),
    ).toEqual(["Organization", "Product", "Thing", "WebSite"]);
  });

  it("continues when a JSON-LD block is malformed", () => {
    const $ = load(`
      <script type="application/ld+json">{ "@type": "Article", }</script>
      <script type="application/ld+json">{ "@type": "WebPage" }</script>
    `);

    const blocks = extractStructuredData($);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual(
      expect.objectContaining({
        type: "json-ld",
        parsed: null,
        schemaTypes: [],
        parseError: expect.any(String),
      }),
    );
    expect(blocks[1]?.schemaTypes).toEqual(["WebPage"]);
  });

  it("bounds raw JSON-LD storage", () => {
    const rawValue = "x".repeat(101_000);
    const $ = load(`
      <script type="application/ld+json">
        { "@type": "Thing", "value": "${rawValue}" }
      </script>
    `);

    const [block] = extractStructuredData($);

    expect(block?.raw).toHaveLength(100_000);
  });
});
