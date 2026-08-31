import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { KbStatusBadge } from "./KbStatusBadge";
import { KbPendingReviewNotice } from "./KbPendingReviewNotice";
import { KbCategoryLabel } from "@/shared/enums/kb/kb.enum";
import type { KbArticleDTO } from "@/shared/types/kb/kb.types";
import { isHtmlContent } from "@/shared/lib/isHtmlContent";
import { RichContentView } from "@/shared/components/editor/RichContentView";

// ── Numbered list detection ────────────────────────────────────────────────────
function isNumberedList(text: string): boolean {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 1 && lines.every((l) => /^\d+[.)]\s/.test(l));
}

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

// ── Section content renderer ──────────────────────────────────────────────────
// Also used by KbArticleSelector to preview an article inline.
export function SectionContent({ text }: { text: string }) {
  // Articles written with rich text (Tiptap) → render sanitized HTML.
  // Older articles are still plain text → keep the old display logic below.
  if (isHtmlContent(text)) {
    return <RichContentView html={text} className="text-foreground/80" />;
  }

  if (isNumberedList(text)) {
    return (
      <ol className="space-y-3">
        {parseLines(text).map((step, i) => (
          <li
            key={i}
            className="flex gap-3 text-sm leading-relaxed text-foreground/80"
          >
            <span className="mt-[1px] flex size-5.5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xs font-semibold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/80">
      {text}
    </p>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function KbArticleDetailSkeleton() {
  return (
    <div>
      <div className="border-b border-border">
        <div className="flex h-14 w-full items-center gap-3 pl-(--page-pl) pr-(--page-pr)">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-7 w-64" />
        </div>
      </div>
      <div className="w-full space-y-4 pt-10 pl-(--page-pl) pr-(--page-pr)">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-3 w-72" />
        <div className="space-y-2.5 pt-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full last:w-2/3" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
interface KbArticleDetailProps {
  article: KbArticleDTO;
  backUrl: string;
  /** Publish / Archive / Versions and the rest of the role-specific toolbar. */
  actions?: React.ReactNode;
  /** When set → shows an "Edit" button that navigates to a dedicated edit page. */
  onEdit?: () => void;
  onMarkHelpful?: () => void;
  helpfulPending?: boolean;
  /** Opens the version history dialog from the "pending review" banner. */
  onViewVersions?: () => void;
}

/**
 * One guide article, read as a document.
 *
 * The article is the whole point of the page, so it gets a single reading column at a
 * comfortable measure instead of competing with a metadata rail. Everything that used to
 * sit in that rail is either in the header strip (code, version, dates), in the footer
 * (helpful, tags), or in the toolbar (the actions). Identity and actions stay pinned to
 * the top so a long article never scrolls its own Edit button out of reach.
 */
export function KbArticleDetail({
  article,
  backUrl,
  actions,
  onEdit,
  onMarkHelpful,
  helpfulPending,
  onViewVersions,
}: KbArticleDetailProps) {
  const navigate = useNavigate();
  const category = KbCategoryLabel[article.category] ?? article.category;

  return (
    <div className="pb-24">
      {/* ── Toolbar: identity on the left, actions on the right ──────────── */}
      {/* The toolbar spans the page, not the reading column: the article wants a narrow
          measure, the action row wants room to stay on one line. */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pl-(--page-pl) pr-(--page-pr)">
          <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="size-3.5" />
            Guide
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {article.code}
          </span>
          <KbStatusBadge status={article.status} />
          <div className="ml-auto flex items-center gap-2">
            {actions}
            {onEdit && (
              <>
                <span aria-hidden className="mx-1 h-5 w-px bg-border" />
                <Button size="sm" className="gap-1.5" onClick={onEdit}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </>
            )}
            <RefreshButton queryKeys={[KEY.kb]} />
          </div>
        </div>
      </div>

      {/* Two columns, matching the editor: the article body on the left, its title and
          facts in a card on the right. The metadata used to be a run-on row above the
          body, which pushed the first paragraph down the page and read as preamble. */}
      <div className="grid w-full items-start gap-8 pt-8 pl-(--page-pl) pr-(--page-pr) lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The body sits on the same card surface as the panel beside it: bare text on
            the page background against a bordered card read as an unfinished column. */}
        <article className="min-w-0 rounded-lg border border-border bg-card p-6">
          <div className="mb-5 empty:mb-0 empty:hidden">
            <KbPendingReviewNotice
              article={article}
              onViewVersions={onViewVersions}
            />
          </div>
          <div className="text-sm">
            <SectionContent text={article.content} />
          </div>
        </article>

        <aside className="space-y-5 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-20">
          <div>
            <p className="text-sm font-medium text-primary">{category}</p>
            <h1 className="mt-2 text-xl font-semibold leading-tight tracking-tight">
              {article.title}
            </h1>
          </div>

          <dl className="space-y-2.5 border-t border-border pt-4 text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="tabular-nums font-medium">{article.version}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Added</dt>
              <dd className="tabular-nums font-medium">
                {format(new Date(article.createdAt), "MMM d, yyyy", {
                  locale: enUS,
                })}
              </dd>
            </div>
            {article.updatedAt && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="tabular-nums font-medium">
                  {format(new Date(article.updatedAt), "MMM d, yyyy HH:mm", {
                    locale: enUS,
                  })}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Found helpful</dt>
              <dd className="tabular-nums font-medium">
                {article.helpfulCount}
              </dd>
            </div>
          </dl>

          {article.tags.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Tags</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-2 py-0.5 text-2xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium">Was this guide useful?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Marking it helpful is how the team finds out which guides are
              worth keeping current.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              disabled={!onMarkHelpful || helpfulPending}
              onClick={onMarkHelpful}
            >
              <ThumbsUp className="size-3.5" />
              Mark as helpful
              <span className="tabular-nums text-muted-foreground">
                {article.helpfulCount}
              </span>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
