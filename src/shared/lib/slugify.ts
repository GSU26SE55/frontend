/**
 * Sinh slug URL-friendly từ tiêu đề tiếng Việt.
 * "Pin không sạc được" → "pin-khong-sac-duoc"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu thanh
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // ký tự lạ → gạch ngang
    .replace(/^-+|-+$/g, "") // bỏ gạch thừa 2 đầu
    .slice(0, 300); // BE giới hạn 300 ký tự
}
