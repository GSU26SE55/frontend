/**
 * Đoán một chuỗi là HTML (do Tiptap sinh) hay text thuần (bài viết cũ).
 *
 * Bài KB tạo trước khi chuyển sang rich text vẫn là text thuần với xuống dòng
 * `\n`. Không thể ép tất cả qua một đường render: HTML mà render như text sẽ lộ
 * thẻ, text mà render như HTML sẽ mất xuống dòng. Hàm này cho phép giữ cả hai.
 *
 * Chỉ nhận diện các thẻ block mà Tiptap thực sự xuất ra ở đầu chuỗi — tránh
 * nhận nhầm text thuần có chứa dấu `<` (ví dụ "nhiệt độ < 5 độ C").
 */
const HTML_START = /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|img|div|hr)[\s>/]/i;

export function isHtmlContent(value?: string | null): boolean {
  if (!value) return false;
  return HTML_START.test(value);
}
