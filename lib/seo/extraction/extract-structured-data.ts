import type { CheerioAPI } from "cheerio";

import type { StructuredDataBlock } from "./types";
import { dedupeStrings, trimOrNull, truncate } from "./utils";

const MAX_JSON_LD_RAW_LENGTH = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectTypeValues(value: unknown, types: string[]): void {
  if (typeof value === "string") {
    const type = trimOrNull(value);

    if (type !== null) {
      types.push(type);
    }

    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTypeValues(item, types);
    }
  }
}

function collectSchemaTypes(value: unknown, types: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectSchemaTypes(item, types);
    }

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  collectTypeValues(value["@type"], types);
  collectSchemaTypes(value["@graph"], types);
}

export function extractSchemaTypesFromJsonLd(value: unknown): string[] {
  const types: string[] = [];
  collectSchemaTypes(value, types);

  return dedupeStrings(types);
}

export function extractStructuredData($: CheerioAPI): StructuredDataBlock[] {
  const blocks: StructuredDataBlock[] = [];

  $('script[type="application/ld+json" i]').each((_, element) => {
    const fullRaw = $(element).text().trim();
    const raw = truncate(fullRaw, MAX_JSON_LD_RAW_LENGTH);

    if (!fullRaw) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(fullRaw);

      blocks.push({
        type: "json-ld",
        raw,
        parsed,
        schemaTypes: extractSchemaTypesFromJsonLd(parsed),
      });
    } catch (error) {
      blocks.push({
        type: "json-ld",
        raw,
        parsed: null,
        schemaTypes: [],
        parseError:
          error instanceof Error ? error.message : "JSON-LD parse failed.",
      });
    }
  });

  return blocks;
}
