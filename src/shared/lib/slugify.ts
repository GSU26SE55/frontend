/**
 * Generates a URL-friendly slug from a Vietnamese title.
 * "Pin không sạc được" → "pin-khong-sac-duoc"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip tone marks
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // unrecognized characters → hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 300); // BE limits to 300 characters
}
