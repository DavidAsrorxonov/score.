import type { CheerioAPI } from "cheerio";

import type { LinkData } from "./types";
import { parseSpaceSeparatedTokens, resolveUrl, trimOrNull } from "./utils";

const IGNORED_PROTOCOLS = new Set(["mailto:", "tel:", "javascript:", "data:"]);

function isHashOnlyHref(href: string): boolean {
  return href.trim().startsWith("#");
}

export function extractLinks($: CheerioAPI, finalUrl: string): LinkData[] {
  const links: LinkData[] = [];
  const baseHostname = new URL(finalUrl).hostname.toLowerCase();

  $("a[href]").each((_, element) => {
    const rawHref = trimOrNull($(element).attr("href"));

    if (rawHref === null || isHashOnlyHref(rawHref)) {
      return;
    }

    const resolvedHref = resolveUrl(rawHref, finalUrl);

    if (resolvedHref === null) {
      return;
    }

    const parsedHref = new URL(resolvedHref);

    if (IGNORED_PROTOCOLS.has(parsedHref.protocol)) {
      return;
    }

    if (parsedHref.protocol !== "http:" && parsedHref.protocol !== "https:") {
      return;
    }

    const rel = parseSpaceSeparatedTokens(trimOrNull($(element).attr("rel")));
    const isInternal = parsedHref.hostname.toLowerCase() === baseHostname;

    links.push({
      href: parsedHref.toString(),
      text: trimOrNull($(element).text()) ?? "",
      rel,
      target: trimOrNull($(element).attr("target")),
      isInternal,
      isExternal: !isInternal,
      isNofollow: rel.includes("nofollow"),
    });
  });

  return links;
}
