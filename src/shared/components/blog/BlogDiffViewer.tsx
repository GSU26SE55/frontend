import { RichContentView } from "@/shared/components/editor/RichContentView";
import type { BlogDiffDTO } from "@/shared/types/blog/blog.types";

interface BlogDiffViewerProps {
  diff: BlogDiffDTO;
}

/**
 * So sánh 2 phiên bản blog — hiển thị side-by-side.
 *
 * Khác KB: BE chỉ trả `oldContentHtml`/`newContentHtml` (không diff từng field),
 * nên không tái dùng được `KbDiffViewer` (bind `KbArticleDiffDTO` 6 section).
 * Cả 2 panel đều render qua `BlogContentView` → đã sanitize.
 */
export function BlogDiffViewer({ diff }: BlogDiffViewerProps) {
  const identical = diff.oldContentHtml === diff.newContentHtml;

  return (
    <div className="space-y-3">
      {identical && (
        <p className="text-muted-foreground text-sm">
          Hai phiên bản có nội dung giống nhau.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <section className="min-w-0">
          <header className="bg-muted/50 text-muted-foreground rounded-t-md border px-3 py-1.5 text-xs font-medium">
            Phiên bản {diff.oldVersionNumber}
          </header>
          <div className="max-h-[60vh] overflow-auto rounded-b-md border border-t-0 p-3">
            <RichContentView html={diff.oldContentHtml} />
          </div>
        </section>

        <section className="min-w-0">
          <header className="bg-muted/50 text-muted-foreground rounded-t-md border px-3 py-1.5 text-xs font-medium">
            Phiên bản {diff.newVersionNumber}
          </header>
          <div className="max-h-[60vh] overflow-auto rounded-b-md border border-t-0 p-3">
            <RichContentView html={diff.newContentHtml} />
          </div>
        </section>
      </div>
    </div>
  );
}
