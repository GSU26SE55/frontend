import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KbStatusBadge } from "@/shared/components/kb/KbStatusBadge";
import { KbPendingChangeBadge } from "@/shared/components/kb/KbPendingChangeBadge";
import { ThumbsUp, BookOpen, Copy, ArrowUpDown } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb/kb.types";
import { KbCategoryLabel } from "@/shared/enums/kb/kb.enum";
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
  onMarkHelpful?: (article: KbArticleSummaryDTO) => void;
  /** Copy this row → create a similar article (opens the create page pre-filled). */
  onCopy?: (article: KbArticleSummaryDTO) => void;
  /** Server-side sort — state comes from useUrlSort. */
  sort: ServerSortState;
}

export default function KbArticleTable({
  data,
  isLoading,
  hasFilter,
  onResetFilter,
  onMarkHelpful,
  onCopy,
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

      {/* A table, not a card grid: these rows are a register that people scan and sort
          by code, status and helpfulness - a grid of boxes makes every row cost the space
          of a card and hides the columns they sort by. */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-44">Category</TableHead>
              <TableHead className="w-52">Status</TableHead>
              <TableHead className="w-20 text-right">Helpful</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((article) => (
              <TableRow
                key={article.id}
                onClick={() => navigate(`/staff/kb/${article.id}`)}
                className="cursor-pointer"
              >
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {article.code}
                </TableCell>
                <TableCell
                  className="max-w-0 truncate font-medium"
                  title={article.title}
                >
                  {article.title}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {KbCategoryLabel[article.category] ?? article.category}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <KbStatusBadge status={article.status} />
                    <KbPendingChangeBadge
                      status={article.status}
                      reviewRequired={article.reviewRequired}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
                <TableCell className="text-right">
                  {onCopy && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mt-1 -mr-1 size-8"
                      title="Copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(article);
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
