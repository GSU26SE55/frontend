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
            <span className="mt-[1px] flex size-5.5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
      {text}
    </p>
  );
}

/** Hairline between two metadata items. Reads as a separator without spending a character. */
function MetaDivider() {
  return <span aria-hidden className="h-3 w-px bg-border" />;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function KbArticleDetailSkeleton() {
  return (
    <div>
      <div className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-6">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-7 w-64" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 pt-10">
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
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-6 py-2.5">
          <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="size-3.5" />
            Guide
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {article.code}
          </span>
          <KbStatusBadge status={article.status} />
          <div className="ml-auto flex items-center gap-2">
            <RefreshButton queryKeys={[KEY.kb]} />
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
          </div>
        </div>
      </div>

      <article className="mx-auto w-full max-w-3xl px-6">
        {/* ── Article header ───────────────────────────────────────────── */}
        <header className="pt-10">
          <p className="text-sm font-medium text-primary">{category}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
            {article.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-border py-2.5 text-xs text-muted-foreground">
            <span className="tabular-nums">Version {article.version}</span>
            <MetaDivider />
            <span className="tabular-nums">
              Added{" "}
              {format(new Date(article.createdAt), "MMM d, yyyy", {
                locale: enUS,
              })}
            </span>
            {article.updatedAt && (
              <>
                <MetaDivider />
                <span className="tabular-nums">
                  Updated{" "}
                  {format(new Date(article.updatedAt), "MMM d, yyyy HH:mm", {
                    locale: enUS,
                  })}
                </span>
              </>
            )}
            <MetaDivider />
            <span className="tabular-nums">
              {article.helpfulCount} found this helpful
            </span>
          </div>
        </header>

        {/* ── Pending review notice ────────────────────────────────────── */}
        <div className="mt-5 empty:mt-0">
          <KbPendingReviewNotice
            article={article}
            onViewVersions={onViewVersions}
          />
        </div>

        {/* ── The article itself ───────────────────────────────────────── */}
        <div className="mt-8 text-[15px]">
          <SectionContent text={article.content} />
        </div>

        {/* ── Footer: feedback, then tags ──────────────────────────────── */}
        <footer className="mt-14 border-t border-border pt-6">
          <p className="text-sm font-medium">Was this guide useful?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Marking it helpful is how the team finds out which guides are worth
            keeping current.
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

          {article.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
