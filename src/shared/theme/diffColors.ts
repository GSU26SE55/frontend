// Màu diff kiểu GitHub cho KbDiffViewer — hệ màu riêng (add xanh / del đỏ),
// tách khỏi token status semantic. Trỏ vào --diff-* trong index.css (có bản dark).
//
// Trước đây KbDiffViewer hardcode hex #ffebe9/#e6ffec... phần lớn KHÔNG có dark.

export type DiffTone = "add" | "del" | "context" | "muted";

/** Biến CSS cho 1 tông diff — dùng inline style (bg + fg). */
export function diffVars(tone: DiffTone): { fg: string; bg: string } {
  switch (tone) {
    case "add":
      return { fg: "var(--diff-add)", bg: "var(--diff-add-soft)" };
    case "del":
      return { fg: "var(--diff-del)", bg: "var(--diff-del-soft)" };
    case "muted":
      return { fg: "var(--muted-foreground)", bg: "var(--surface-2)" };
    case "context":
    default:
      return { fg: "var(--foreground)", bg: "var(--background)" };
  }
}
