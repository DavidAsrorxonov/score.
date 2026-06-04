import { load } from "cheerio";

import { extractHeadings } from "./extract-headings";
import { extractImages } from "./extract-images";
import { extractLinks } from "./extract-links";
import { extractMetadata } from "./extract-metadata";
import { extractStructuredData } from "./extract-structured-data";
import { extractText } from "./extract-text";
import type { ExtractedPageSeo, ExtractPageSeoParams } from "./types";
import { dedupeStrings } from "./utils";

export function extractPageSeo({
  html,
  url,
  finalUrl,
}: ExtractPageSeoParams): ExtractedPageSeo {
  const $ = load(html);
  const metadata = extractMetadata($, finalUrl);
  const headings = extractHeadings($);
  const links = extractLinks($, finalUrl);
  const images = extractImages($, finalUrl);
  const structuredData = extractStructuredData($);
  const text = extractText($);
  const internalLinks = links.filter((link) => link.isInternal);
  const externalLinks = links.filter((link) => link.isExternal);
  const h1 = headings
    .filter((heading) => heading.level === 1)
    .map((heading) => heading.text);
  const h2 = headings
    .filter((heading) => heading.level === 2)
    .map((heading) => heading.text);
  const h3 = headings
    .filter((heading) => heading.level === 3)
    .map((heading) => heading.text);

  return {
    url,
    finalUrl,
    ...metadata,
    headings,
    h1,
    h2,
    h3,
    links,
    internalLinks,
    externalLinks,
    images,
    imagesMissingAltCount: images.filter((image) => !image.hasAlt).length,
    structuredData,
    schemaTypes: dedupeStrings(
      structuredData.flatMap((block) => block.schemaTypes),
    ),
    wordCount: text.wordCount,
    textSample: text.textSample,
  };
}
