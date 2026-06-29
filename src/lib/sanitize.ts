const ALLOWED_TAGS = new Set(["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"]);
const ALLOWED_ATTR = new Set(["href", "target", "rel"]);

export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, (tag) => {
    const match = tag.match(/^<\/(\w+)/) || tag.match(/^<(\w+)/);
    if (!match) return "";
    const tagName = match[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) return "";

    if (tag.startsWith("</")) return tag;

    const attrs = tag.slice(1, -1).match(/(\w+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g) ?? [];
    const filtered = attrs.filter((attr) => {
      const name = attr.split("=")[0];
      return ALLOWED_ATTR.has(name);
    });

    if (filtered.length > 0) return `<${tagName} ${filtered.join(" ")}>`;
    return `<${tagName}>`;
  });
}

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}
