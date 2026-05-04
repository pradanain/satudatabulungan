const DANGEROUS_BLOCK_TAG_PATTERN =
  /<\s*(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG_PATTERN = /<\/?[^>]+>/g;

export function sanitizeStoredText(value: string): string {
  return value
    .replace(DANGEROUS_BLOCK_TAG_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

