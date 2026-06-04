export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function trimOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = normalizeWhitespace(value);

  return normalized.length > 0 ? normalized : null;
}

export function safeGetAttribute(
  value: string | undefined,
): string | null {
  return trimOrNull(value);
}

export function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(normalized);
  }

  return deduped;
}

export function resolveUrl(value: string, baseUrl: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

export function parseSpaceSeparatedTokens(value: string | null): string[] {
  if (value === null) {
    return [];
  }

  return dedupeStrings(
    value
      .split(/\s+/u)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
