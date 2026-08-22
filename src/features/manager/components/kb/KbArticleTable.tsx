import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KbStatusBadge } from "@/shared/components/kb/KbStatusBadge";
import { KbPendingChangeBadge } from "@/shared/components/kb/KbPendingChangeBadge";
import {
  ThumbsUp,
  EllipsisVertical,
  BookOpen,
  ArrowUpDown,
} from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb/kb.types";
import {
  KbArticleStatusEnum,
  KbCategoryLabel,
} from "@/shared/enums/kb/kb.enum";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { noData, notFound } from "@/shared/constants/emptyStates";

const NONE_SORT = "__none__";

const SORT_ITEMS = [
  { value: "code", label: "Code" },
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" },
  { value: "helpfulCount", label: "Helpful" },
];

interface KbArticleTableProps {
  data: KbArticleSummaryDTO[];
  isLoading?: boolean;
  hasFilter?: boolean;
  onResetFilter?: () => void;
  onPublish?: (article: KbArticleSummaryDTO) => void;
  onArchive?: (article: KbArticleSummaryDTO) => void;
  onDelete?: (article: KbArticleSummaryDTO) => void;
  onMarkHelpful?: (article: KbArticleSummaryDTO) => void;
  onEdit?: (article: KbArticleSummaryDTO) => void;
  /** Copy this row → create a similar new article (opens the create page pre-filled). */
  onCopy?: (article: KbArticleSummaryDTO) => void;
  /** Generate a blog post from this article — BE only accepts Published articles (409 otherwise). */
  onGenerateBlog?: (article: KbArticleSummaryDTO) => void;
  /** Server-side sort — state from useUrlSort. */
  sort: ServerSortState;
}

export default function KbArticleTable({
  data,
  isLoading,
  hasFilter,
  onResetFilter,
  onPublish,
  onArchive,
  onDelete,
  onMarkHelpful,
  onEdit,
  onCopy,
  onGenerateBlog,
  sort,
}: KbArticleTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <BookOpen className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {hasFilter ? notFound("articles") : noData("articles")}
        </p>
        {hasFilter && onResetFilter && (
          <Button size="sm" variant="outline" onClick={onResetFilter}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1">
        <span className="text-xs text-muted-foreground">Sort</span>
        <Select
          value={sort.sortBy ?? NONE_SORT}
          onValueChange={(v) =>
            sort.setSort(v && v !== NONE_SORT ? v : null, sort.sortDir)
          }
          items={[{ value: NONE_SORT, label: "Default" }, ...SORT_ITEMS]}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={NONE_SORT}>Default</SelectItem>
            {SORT_ITEMS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={!sort.sortBy}
          onClick={() =>
            sort.sortBy &&
            sort.setSort(sort.sortBy, sort.sortDir === "asc" ? "desc" : "asc")
          }
          title={sort.sortDir === "desc" ? "Descending" : "Ascending"}
        >
          <ArrowUpDown className="size-3.5" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((article) => (
          <Card
            key={article.id}
            onClick={() => navigate(`/manager/kb/${article.id}`)}
            className="cursor-pointer p-5 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">
                {article.code}
              </p>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-mt-1 -mr-1 size-8"
                      />
                    }
                  >
                    <EllipsisVertical className="size-4.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={() =>
                        onEdit
                          ? onEdit(article)
                          : navigate(`/manager/kb/${article.id}/edit`)
                      }
                    >
                      Edit
                    </DropdownMenuItem>
                    {onCopy && (
                      <DropdownMenuItem onClick={() => onCopy(article)}>
                        Copy
                      </DropdownMenuItem>
                    )}
                    {article.status === KbArticleStatusEnum.Draft &&
                      onPublish && (
                        <DropdownMenuItem onClick={() => onPublish(article)}>
                          Publish
                        </DropdownMenuItem>
                      )}
                    {article.status === KbArticleStatusEnum.Published &&
                      onGenerateBlog && (
                        <DropdownMenuItem
                          onClick={() => onGenerateBlog(article)}
                        >
                          Generate blog
                        </DropdownMenuItem>
                      )}
                    {article.status === KbArticleStatusEnum.Published &&
                      onArchive && (
                        <DropdownMenuItem onClick={() => onArchive(article)}>
                          Archive
                        </DropdownMenuItem>
                      )}
                    {/* Archiving is reversible: publish takes an archived article back into
                        circulation. Without this entry an accidental archive could only be
                        undone in the database. */}
                    {article.status === KbArticleStatusEnum.Archived &&
                      onPublish && (
                        <DropdownMenuItem onClick={() => onPublish(article)}>
                          Restore
                        </DropdownMenuItem>
                      )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(article)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <h3 className="mt-2 line-clamp-2 text-base font-medium leading-snug">
              {article.title}
            </h3>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <KbStatusBadge status={article.status} />
              <KbPendingChangeBadge
                status={article.status}
                reviewRequired={article.reviewRequired}
              />
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {KbCategoryLabel[article.category] ?? article.category}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-end gap-4 border-t border-border/60 pt-3">
              {onMarkHelpful ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkHelpful(article);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <ThumbsUp className="size-3.5" /> {article.helpfulCount}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ThumbsUp className="size-3.5" /> {article.helpfulCount}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
