import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KbStatusBadge } from "@/shared/components/common/kb/KbStatusBadge";
import { Eye, ThumbsUp, BookOpen } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import { KbCategoryLabel } from "@/shared/enums/kb.enum";
import { SortableTableHead } from "@/shared/components/common/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

interface KbArticleTableProps {
  data: KbArticleSummaryDTO[];
  isLoading?: boolean;
  pageNumber: number;
  pageSize: number;
  hasFilter?: boolean;
  onResetFilter?: () => void;
  onMarkHelpful?: (article: KbArticleSummaryDTO) => void;
}

export default function KbArticleTable({
  data,
  isLoading,
  hasFilter,
  onResetFilter,
  onMarkHelpful,
}: KbArticleTableProps) {
  const navigate = useNavigate();
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData<KbArticleSummaryDTO>(data, (article, key) => {
      switch (key) {
        case "code":
          return article.code;
        case "title":
          return article.title;
        case "category":
          return KbCategoryLabel[article.category] ?? article.category;
        case "status":
          return article.status;
        case "viewCount":
          return article.viewCount;
        case "helpfulCount":
          return article.helpfulCount;
        default:
          return null;
      }
    });

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
          {hasFilter
            ? "Không khớp với bộ lọc hiện tại"
            : "Chưa có bài viết nào"}
        </p>
        {hasFilter && onResetFilter && (
          <Button size="sm" variant="outline" onClick={onResetFilter}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            sortKey="code"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-25 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Mã
          </SortableTableHead>
          <SortableTableHead
            sortKey="title"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Tiêu đề
          </SortableTableHead>
          <SortableTableHead
            sortKey="category"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-27.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Danh mục
          </SortableTableHead>
          <SortableTableHead
            sortKey="status"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Trạng thái
          </SortableTableHead>
          <SortableTableHead
            sortKey="viewCount"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-22.5 justify-center text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Lượt xem
          </SortableTableHead>
          <SortableTableHead
            sortKey="helpfulCount"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-22.5 justify-center text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Hữu ích
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((article) => (
          <TableRow
            key={article.id}
            className="cursor-pointer h-11 hover:bg-muted/40"
            onClick={() => navigate(`/staff/kb/${article.id}`)}
          >
            <TableCell className="py-2 font-mono text-[11px] text-muted-foreground">
              {article.code}
            </TableCell>
            <TableCell className="py-2">
              <p className="text-[13px] font-medium leading-tight">
                {article.title}
              </p>
            </TableCell>
            <TableCell className="py-2">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {KbCategoryLabel[article.category] ?? article.category}
              </span>
            </TableCell>
            <TableCell className="py-2">
              <KbStatusBadge status={article.status} />
            </TableCell>
            <TableCell className="py-2 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Eye className="size-3" /> {article.viewCount}
              </span>
            </TableCell>
            <TableCell
              className="py-2 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {onMarkHelpful ? (
                <button
                  type="button"
                  onClick={() => onMarkHelpful(article)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <ThumbsUp className="size-3" /> {article.helpfulCount}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ThumbsUp className="size-3" /> {article.helpfulCount}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
