import type { CheerioAPI } from "cheerio";

import type { HeadingData, HeadingLevel } from "./types";
import { trimOrNull } from "./utils";

const HEADING_SELECTOR = "h1,h2,h3,h4,h5,h6";

function parseHeadingLevel(tagName: string): HeadingLevel | null {
  const level = Number.parseInt(tagName.replace("h", ""), 10);

  return level >= 1 && level <= 6 ? (level as HeadingLevel) : null;
}

export function extractHeadings($: CheerioAPI): HeadingData[] {
  const headings: HeadingData[] = [];

  $(HEADING_SELECTOR).each((_, element) => {
    const level = parseHeadingLevel(element.tagName.toLowerCase());
    const text = trimOrNull($(element).text());

    if (level !== null && text !== null) {
      headings.push({ level, text });
    }
  });

  return headings;
}
