import type { CheerioAPI } from "cheerio";

import { normalizeWhitespace, truncate } from "./utils";

const TEXT_SAMPLE_MAX_LENGTH = 2_000;
const NON_VISIBLE_SELECTORS =
  "script,style,noscript,svg,canvas,template,head";

export interface ExtractTextResult {
  wordCount: number;
  textSample: string;
}

function countWords(text: string): number {
  if (!text) {
    return 0;
  }

  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean).length;
}

export function extractText($: CheerioAPI): ExtractTextResult {
  const body = $("body").clone();

  if (body.length === 0) {
    return {
      wordCount: 0,
      textSample: "",
    };
  }

  body.find(NON_VISIBLE_SELECTORS).remove();

  const text = normalizeWhitespace(body.text());

  return {
    wordCount: countWords(text),
    textSample: truncate(text, TEXT_SAMPLE_MAX_LENGTH),
  };
}
