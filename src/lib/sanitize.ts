import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window as unknown as Window & typeof globalThis;
const purify = DOMPurify(window);

export function sanitizeHtml(input: string): string {
  return purify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

export function stripHtml(input: string): string {
  return purify.sanitize(input, { ALLOWED_TAGS: [] });
}
