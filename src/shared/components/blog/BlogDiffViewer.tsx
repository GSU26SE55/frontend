import { RichContentView } from "@/shared/components/editor/RichContentView";
import type { BlogDiffDTO } from "@/shared/types/blog/blog.types";

interface BlogDiffViewerProps {
  diff: BlogDiffDTO;
}

/**
 * Compares 2 blog versions — rendered side-by-side.
 *
 * Different from KB: the BE only returns `oldContentHtml`/`newContentHtml` (no
 * per-field diff), so `KbDiffViewer` (bound to the 6-section `KbArticleDiffDTO`)
 * can't be reused here. Both panels render through `BlogContentView` → already sanitized.
 */
export function BlogDiffViewer({ diff }: BlogDiffViewerProps) {
  const identical = diff.oldContentHtml === diff.newContentHtml;

  return (
    <div className="space-y-3">
      {identical && (
        <p className="text-muted-foreground text-sm">
          Both versions have identical content.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <section className="min-w-0">
          <header className="bg-muted/50 text-muted-foreground rounded-t-md border px-3 py-1.5 text-xs font-medium">
            Version {diff.oldVersionNumber}
          </header>
          <div className="max-h-[60vh] overflow-auto rounded-b-md border border-t-0 p-3">
            <RichContentView html={diff.oldContentHtml} />
          </div>
        </section>

        <section className="min-w-0">
          <header className="bg-muted/50 text-muted-foreground rounded-t-md border px-3 py-1.5 text-xs font-medium">
            Version {diff.newVersionNumber}
          </header>
          <div className="max-h-[60vh] overflow-auto rounded-b-md border border-t-0 p-3">
            <RichContentView html={diff.newContentHtml} />
          </div>
        </section>
      </div>
    </div>
  );
}
