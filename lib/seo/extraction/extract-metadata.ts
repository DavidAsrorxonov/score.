import type { CheerioAPI } from "cheerio";

import { resolveUrl, safeGetAttribute, trimOrNull } from "./utils";

interface ExtractMetadataResult {
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  canonicalUrl: string | null;
  htmlLang: string | null;
  charset: string | null;
  viewport: string | null;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
}

function getMetaContentByName($: CheerioAPI, name: string): string | null {
  return trimOrNull($(`meta[name="${name}" i]`).first().attr("content"));
}

function extractContentTypeCharset(contentType: string | null): string | null {
  if (contentType === null) {
    return null;
  }

  const charset = contentType
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("charset="));

  return trimOrNull(charset?.split("=")[1]?.replace(/^"|"$/g, ""));
}

function extractMetaMap(
  $: CheerioAPI,
  selector: string,
  keyAttribute: "name" | "property",
): Record<string, string> {
  const metadata: Record<string, string> = {};

  $(selector).each((_, element) => {
    const key = safeGetAttribute($(element).attr(keyAttribute));
    const content = trimOrNull($(element).attr("content"));

    if (key !== null && content !== null && metadata[key] === undefined) {
      metadata[key] = content;
    }
  });

  return metadata;
}

export function extractMetadata(
  $: CheerioAPI,
  finalUrl: string,
): ExtractMetadataResult {
  const canonicalHref = trimOrNull($('link[rel~="canonical" i]').first().attr("href"));
  const charset =
    trimOrNull($("meta[charset]").first().attr("charset")) ??
    extractContentTypeCharset(
      trimOrNull($('meta[http-equiv="Content-Type" i]').first().attr("content")),
    );

  return {
    title: trimOrNull($("title").first().text()),
    metaDescription: getMetaContentByName($, "description"),
    metaRobots: getMetaContentByName($, "robots"),
    canonicalUrl:
      canonicalHref !== null ? resolveUrl(canonicalHref, finalUrl) : null,
    htmlLang: trimOrNull($("html").first().attr("lang")),
    charset,
    viewport: getMetaContentByName($, "viewport"),
    openGraph: extractMetaMap($, 'meta[property^="og:" i]', "property"),
    twitterCard: extractMetaMap($, 'meta[name^="twitter:" i]', "name"),
  };
}
