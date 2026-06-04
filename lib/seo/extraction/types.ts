export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingData {
  level: HeadingLevel;
  text: string;
}

export interface LinkData {
  href: string;
  text: string;
  rel: string[];
  target: string | null;
  isInternal: boolean;
  isExternal: boolean;
  isNofollow: boolean;
}

export interface ImageData {
  src: string;
  alt: string | null;
  title: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
  hasAlt: boolean;
}

export interface StructuredDataBlock {
  type: "json-ld";
  raw: string;
  parsed: unknown | null;
  schemaTypes: string[];
  parseError?: string;
}

export interface ExtractedPageSeo {
  url: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  canonicalUrl: string | null;
  htmlLang: string | null;
  charset: string | null;
  viewport: string | null;
  headings: HeadingData[];
  h1: string[];
  h2: string[];
  h3: string[];
  links: LinkData[];
  internalLinks: LinkData[];
  externalLinks: LinkData[];
  images: ImageData[];
  imagesMissingAltCount: number;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  structuredData: StructuredDataBlock[];
  schemaTypes: string[];
  wordCount: number;
  textSample: string;
}

export interface ExtractPageSeoParams {
  html: string;
  url: string;
  finalUrl: string;
}
