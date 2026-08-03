// Bóc danh sách biến {{...}} ra khỏi template Handlebars, để dựng form nhập dữ liệu mẫu thay vì
// bắt admin gõ JSON tay.
//
// Vì sao cần: mỗi mẫu dùng một bộ biến khác nhau (ticket có code/priority, pin có
// assetSerialNumber/thresholdValue…). Trước đây ô nhập là JSON thô kèm gợi ý CỐ ĐỊNH dùng chung cho
// cả 82 mẫu, mà admin không có cách nào nhìn ra vì bảng chỉ hiện tiêu đề, không hiện thân mẫu.
//
// ⚠️ 03/08/2026 — hàm này chỉ bóc tên biến người soạn ĐÃ GÕ, nó KHÔNG biết tên nào hợp lệ.
// Danh sách hợp lệ lấy từ `GET /api/admin/notification-templates/variables` và được đối chiếu ở
// `TemplateVariablePalette`. Phân biệt này quan trọng: bộ mẫu cũ từng gõ `{{ticketCode}}` trong khi
// consumer ghi khoá `code`, và `{{serialNumber}}` trong khi consumer ghi `assetSerialNumber` —
// Handlebars render biến lạ ra RỖNG chứ không báo lỗi nên không ai phát hiện suốt nhiều tháng.

// {{var}} · {{{var}}} (in không escape) · {{ var }} (có khoảng trắng thừa).
// [^{}]* để không nuốt nhầm sang token kế tiếp.
const HANDLEBARS_TOKEN = /\{\{\{?([^{}]*)\}\}\}?/g;

// Ký tự mở đầu của cú pháp KHÔNG phải biến điền được:
//   #  mở block {{#if}}     /  đóng block {{/if}}   ^  block đảo {{^x}}
//   !  chú thích            >  partial              &  in không escape
//   @  biến do runtime cấp {{@index}} — không đến từ dữ liệu mẫu
const NON_VARIABLE_PREFIXES = new Set(["#", "/", "^", "!", ">", "&", "@"]);

// Từ khoá Handlebars, không phải biến.
const RESERVED_KEYWORDS = new Set(["else", "this"]);

/**
 * Trả về tên các biến theo THỨ TỰ XUẤT HIỆN LẦN ĐẦU, đã khử trùng lặp.
 *
 * Giới hạn có chủ đích: bỏ qua lời gọi helper có tham số (`{{formatDate x}}`) vì không tách được
 * đâu là biến cần điền. Bộ template hiện tại (82 mẫu, 39 biến) không dùng helper, block, hay
 * triple-brace nào — đã quét toàn bộ DB ngày 02/08/2026. Hàm vẫn xử lý các dạng đó để khi ai thêm
 * mẫu mới thì form không hiện ra rác.
 */
export function extractPlaceholders(
  ...templates: (string | null | undefined)[]
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const template of templates) {
    if (!template) continue;

    for (const match of template.matchAll(HANDLEBARS_TOKEN)) {
      const name = (match[1] ?? "").trim();

      if (!name) continue;
      if (NON_VARIABLE_PREFIXES.has(name[0])) continue;
      // Còn khoảng trắng bên trong ⇒ lời gọi helper, không phải một biến đơn.
      if (/\s/.test(name)) continue;
      if (RESERVED_KEYWORDS.has(name)) continue;
      if (seen.has(name)) continue;

      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

/**
 * Nối `{{tên}}` vào cuối nội dung đang soạn — dùng cho nút bấm-để-chèn ở bảng biến hợp lệ.
 * Tự thêm một khoảng trắng khi nối vào cuối câu đang dở, để token không dính vào chữ trước đó.
 */
export function insertPlaceholder(current: string, name: string): string {
  const token = `{{${name}}}`;
  if (!current) return token;
  return /\s$/.test(current) ? current + token : `${current} ${token}`;
}

/**
 * Đưa một giá trị bất kỳ trong JSON về chuỗi hiển thị được trong ô input, dùng khi chuyển từ chế độ
 * JSON sang chế độ form. `null`/`undefined` → rỗng (đồng nghĩa "không truyền").
 */
export function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}
