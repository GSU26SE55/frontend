import { describe, expect, it } from "vitest";
import { slugify } from "@/shared/lib/slugify";
import { isHtmlContent } from "@/shared/lib/isHtmlContent";

describe("slugify", () => {
  it("bỏ dấu tiếng Việt", () => {
    expect(slugify("Pin không sạc được")).toBe("pin-khong-sac-duoc");
  });

  // Chữ đ không phải là chữ d có dấu nên NFD không tách được — phải thay riêng.
  it("chuyển đ và Đ thành d", () => {
    expect(slugify("Đo điện áp đầu ra")).toBe("do-dien-ap-dau-ra");
  });

  it("gộp khoảng trắng và ký tự lạ thành một dấu gạch", () => {
    expect(slugify("Pin   lỗi --- nặng!!!")).toBe("pin-loi-nang");
  });

  it("cắt gạch thừa ở hai đầu", () => {
    expect(slugify("  --- Pin hỏng ---  ")).toBe("pin-hong");
  });

  it("giữ nguyên chữ số", () => {
    expect(slugify("Pin LiFePO4 48V 100Ah")).toBe("pin-lifepo4-48v-100ah");
  });

  it("chuỗi toàn ký tự đặc biệt trả về rỗng", () => {
    expect(slugify("!!!  ???")).toBe("");
  });

  it("chuỗi rỗng trả về rỗng", () => {
    expect(slugify("")).toBe("");
  });

  // Cột slug bên backend giới hạn 300 ký tự; vượt là 500 lúc lưu.
  it("cắt tối đa 300 ký tự", () => {
    const slug = slugify("a".repeat(400));
    expect(slug).toHaveLength(300);
  });
});

describe("isHtmlContent", () => {
  it.each([
    "<p>Nội dung</p>",
    "  <h2>Tiêu đề</h2>",
    "<ul><li>Bước 1</li></ul>",
    "<blockquote>Ghi chú</blockquote>",
    "<PRE>code</PRE>",
    "<hr/>",
  ])("nhận ra HTML do trình soạn thảo sinh ra: %s", (value) => {
    expect(isHtmlContent(value)).toBe(true);
  });

  // Bài viết cũ là văn bản thuần; render nhầm sang HTML sẽ mất hết xuống dòng.
  it.each([
    "Bài viết cũ\nxuống dòng bằng \\n",
    "Nhiệt độ < 5°C thì ngừng sạc",
    "5 < 10 và 10 > 5",
  ])("không nhận nhầm văn bản thuần: %s", (value) => {
    expect(isHtmlContent(value)).toBe(false);
  });

  it.each([null, undefined, ""])(
    "giá trị rỗng (%s) không phải HTML",
    (value) => {
      expect(isHtmlContent(value)).toBe(false);
    },
  );

  // Thẻ nằm giữa chuỗi không tính — chỉ thẻ khối ở đầu mới là dấu hiệu của trình soạn thảo.
  it("thẻ xuất hiện giữa chuỗi vẫn là văn bản thuần", () => {
    expect(isHtmlContent("Xem thêm <p>ở đây</p>")).toBe(false);
  });
});
