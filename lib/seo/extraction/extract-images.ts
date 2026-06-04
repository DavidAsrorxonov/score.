import type { CheerioAPI } from "cheerio";

import type { ImageData } from "./types";
import { resolveUrl, trimOrNull } from "./utils";

export function extractImages($: CheerioAPI, finalUrl: string): ImageData[] {
  const images: ImageData[] = [];

  $("img[src]").each((_, element) => {
    const rawSrc = trimOrNull($(element).attr("src"));

    if (rawSrc === null) {
      return;
    }

    const src = resolveUrl(rawSrc, finalUrl);

    if (src === null) {
      return;
    }

    const alt = trimOrNull($(element).attr("alt"));

    images.push({
      src,
      alt,
      title: trimOrNull($(element).attr("title")),
      width: trimOrNull($(element).attr("width")),
      height: trimOrNull($(element).attr("height")),
      loading: trimOrNull($(element).attr("loading")),
      hasAlt: alt !== null,
    });
  });

  return images;
}
