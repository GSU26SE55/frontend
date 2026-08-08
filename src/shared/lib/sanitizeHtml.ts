import DOMPurify from "dompurify";

/**
 * Sanitizes HTML before rendering with `dangerouslySetInnerHTML`.
 *
 * MUST be used for every Blog `contentHtml` — including AI-generated content
 * (`origin = AiGeneratedFromKb`): data from the BE/LLM is not a trusted source.
 */
export function sanitizeHtml(html?: string | null): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "hr",
      "blockquote",
      "pre",
      "code",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "mark",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
    ],
    // data-file-id: images stored by fileId, the viewer loads the blob itself (see AuthImageNode)
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "title",
      "class",
      "data-file-id",
    ],
    // Blocks javascript:, data: (except base64 images) — prevents XSS via href/src
    ALLOWED_URI_REGEXP:
      /^(?:https?:|mailto:|tel:|data:image\/(?:png|jpeg|gif|webp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Extracts plain text from HTML — used to validate "empty" and show a short preview.
 *
 * This function is called from a zod schema, and the schema can run outside the
 * browser (Node unit tests, SSR) → must have a branch that doesn't depend on the DOM.
 */
export function htmlToPlainText(html?: string | null): string {
  if (!html) return "";

  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  const el = document.createElement("div");
  el.innerHTML = sanitizeHtml(html);
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}
