import DOMPurify from "dompurify";

/**
 * Làm sạch HTML trước khi render bằng `dangerouslySetInnerHTML`.
 *
 * BẮT BUỘC dùng cho mọi `contentHtml` của Blog — kể cả nội dung do AI sinh
 * (`origin = AiGeneratedFromKb`): dữ liệu từ BE/LLM không phải nguồn tin cậy.
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
    // data-file-id: ảnh lưu theo fileId, viewer tự nạp blob (xem AuthImageNode)
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
    // Chặn javascript:, data: (trừ ảnh base64) — tránh XSS qua href/src
    ALLOWED_URI_REGEXP:
      /^(?:https?:|mailto:|tel:|data:image\/(?:png|jpeg|gif|webp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Lấy text thuần từ HTML — dùng để validate "rỗng" và hiện preview ngắn.
 *
 * Hàm này được gọi từ zod schema, mà schema có thể chạy ngoài trình duyệt
 * (unit test Node, SSR) → phải có nhánh không phụ thuộc DOM.
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
