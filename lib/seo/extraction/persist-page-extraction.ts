import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { scanPages } from "@/lib/db/schema";

import type { ExtractedPageSeo, ImageData, LinkData } from "./types";

const MAX_STORED_LINKS = 500;
const MAX_STORED_IMAGES = 500;

interface PersistPageExtractionParams {
  scanId: string;
  pageId?: string;
  extraction: ExtractedPageSeo;
}

function limitItems<T>(items: T[], maxItems: number): T[] {
  return items.slice(0, maxItems);
}

function serializeLinks(links: LinkData[]): Record<string, unknown>[] {
  return links.map((link) => ({ ...link }));
}

function serializeImages(images: ImageData[]): Record<string, unknown>[] {
  return images.map((image) => ({ ...image }));
}

function buildTechnicalData(extraction: ExtractedPageSeo) {
  return {
    htmlLang: extraction.htmlLang,
    charset: extraction.charset,
    viewport: extraction.viewport,
    headingCount: extraction.headings.length,
    linkCount: extraction.links.length,
    structuredDataBlockCount: extraction.structuredData.length,
    textSample: extraction.textSample,
    headings: extraction.headings,
    links: serializeLinks(limitItems(extraction.links, MAX_STORED_LINKS)),
    images: serializeImages(limitItems(extraction.images, MAX_STORED_IMAGES)),
    structuredData: extraction.structuredData,
    storedLinkLimit: MAX_STORED_LINKS,
    storedImageLimit: MAX_STORED_IMAGES,
  };
}

export async function persistPageExtraction({
  scanId,
  pageId,
  extraction,
}: PersistPageExtractionParams) {
  const now = new Date();
  const extractionValues = {
    title: extraction.title,
    metaDescription: extraction.metaDescription,
    canonicalUrl: extraction.canonicalUrl,
    metaRobots: extraction.metaRobots,
    h1: extraction.h1,
    h2: extraction.h2,
    h3: extraction.h3,
    wordCount: extraction.wordCount,
    internalLinkCount: extraction.internalLinks.length,
    externalLinkCount: extraction.externalLinks.length,
    imageCount: extraction.images.length,
    imagesMissingAltCount: extraction.imagesMissingAltCount,
    schemaTypes: extraction.schemaTypes,
    openGraph: extraction.openGraph,
    twitterCard: extraction.twitterCard,
    technicalData: buildTechnicalData(extraction),
    updatedAt: now,
  };

  if (pageId !== undefined) {
    await db
      .update(scanPages)
      .set(extractionValues)
      .where(and(eq(scanPages.id, pageId), eq(scanPages.scanId, scanId)));

    return;
  }

  await db
    .insert(scanPages)
    .values({
      scanId,
      url: extraction.url,
      finalUrl: extraction.finalUrl,
      ...extractionValues,
    })
    .onConflictDoUpdate({
      target: [scanPages.scanId, scanPages.url],
      set: {
        finalUrl: extraction.finalUrl,
        ...extractionValues,
      },
    });
}
