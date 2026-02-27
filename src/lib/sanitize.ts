import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// Strip all HTML tags — we store markdown, not HTML
// This prevents stored XSS when markdown is later rendered
export function sanitizeMarkdown(input: string | null | undefined): string | null {
  if (!input) return input as null;

  // DOMPurify with no allowed tags strips all HTML
  const cleaned = purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return cleaned;
}

// Sanitize plain text fields (titles, names, etc.)
// Escapes HTML entities to prevent injection
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
