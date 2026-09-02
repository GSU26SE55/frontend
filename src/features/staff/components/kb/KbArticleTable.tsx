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
import { KbStatusBadge } from "@/shared/components/kb/KbStatusBadge";
import { KbPendingChangeBadge } from "@/shared/components/kb/KbPendingChangeBadge";
import { ThumbsUp, BookOpen, Copy } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb/kb.types";
import { KbCategoryLabel } from "@/shared/enums/kb/kb.enum";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { noData, notFound } from "@/shared/constants/emptyStates";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KbArticleTableProps {
  data: KbArticleSummaryDTO[];
  isLoading?: boolean;
  hasFilter?: boolean;
  onResetFilter?: () => void;
  /** Copy this row → create a similar article (opens the create page pre-filled). */
  onCopy?: (article: KbArticleSummaryDTO) => void;
  pageNumber: number;
  pageSize: number;
  /** Server-side sort — state comes from useUrlSort. */
  sort: ServerSortState;
}

export default function KbArticleTable({
  data,
  isLoading,
  hasFilter,
  onResetFilter,
  onCopy,
  pageNumber,
  pageSize,
  sort,
}: KbArticleTableProps) {
  const navigate = useNavigate();

  // BE already sorts the whole dataset (SortBy/SortDir) → render items as-is.
  const sortKey = sort.sortBy;
  const sortDirection = sort.sortDir;
  const toggleSort = sort.toggleSort;

  if (isLoading) {
    return (
      <Card className="gap-0 py-0 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="gap-0 py-0 overflow-hidden">
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
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* A table, not a card grid: these rows are a register that people scan and sort
          by code, status and helpfulness - a grid of boxes makes every row cost the space
          of a card and hides the columns they sort by. */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                {TABLE_COLUMNS.index}
              </TableHead>
              <SortableTableHead
                sortKey="code"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-28"
              >
                Code
              </SortableTableHead>
              <SortableTableHead
                sortKey="title"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              >
                Title
              </SortableTableHead>
              <SortableTableHead
                sortKey="category"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-44"
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-52"
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                sortKey="helpfulCount"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-20 text-right"
              >
                Helpful
              </SortableTableHead>
              <TableHead className="text-right">
                {TABLE_COLUMNS.actions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((article, index) => (
              <TableRow
                key={article.id}
                onClick={() => navigate(`/staff/kb/${article.id}`)}
                className="cursor-pointer"
              >
                <TableCell className="text-center text-muted-foreground tabular-nums">
                  {(pageNumber - 1) * pageSize + index + 1}
                </TableCell>
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
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="size-3.5" /> {article.helpfulCount}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {onCopy && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mt-1 -mr-1 size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopy(article);
                            }}
                          />
                        }
                      >
                        <Copy className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
