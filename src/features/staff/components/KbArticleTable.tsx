import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KbStatusBadge } from "@/shared/components/kb/KbStatusBadge";
import { Eye, ThumbsUp, BookOpen } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import { KbCategoryLabel } from "@/shared/enums/kb.enum";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { noData } from "@/shared/constants/emptyStates";

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
          {hasFilter ? "Không khớp với bộ lọc hiện tại" : noData("bài viết")}
        </p>
        {hasFilter && onResetFilter && (
          <Button size="sm" variant="outline" onClick={onResetFilter}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
    );
  }

  const columns: ColumnDef<KbArticleSummaryDTO>[] = [
    {
      id: "code",
      header: "Mã",
      sortKey: "code",
      sortValue: (article) => article.code,
      headClassName:
        "w-25 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      cellClassName: "py-2 font-mono text-[11px] text-muted-foreground",
      cell: (article) => article.code,
    },
    {
      id: "title",
      header: "Tiêu đề",
      sortKey: "title",
      sortValue: (article) => article.title,
      headClassName:
        "text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      cellClassName: "py-2",
      cell: (article) => (
        <p className="text-[13px] font-medium leading-tight">{article.title}</p>
      ),
    },
    {
      id: "category",
      header: "Danh mục",
      sortKey: "category",
      sortValue: (article) =>
        KbCategoryLabel[article.category] ?? article.category,
      headClassName:
        "w-27.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      cellClassName: "py-2",
      cell: (article) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {KbCategoryLabel[article.category] ?? article.category}
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      sortKey: "status",
      sortValue: (article) => article.status,
      headClassName:
        "w-30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      cellClassName: "py-2",
      cell: (article) => <KbStatusBadge status={article.status} />,
    },
    {
      id: "viewCount",
      header: "Lượt xem",
      sortKey: "viewCount",
      sortValue: (article) => article.viewCount,
      headClassName:
        "w-22.5 justify-center text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      cellClassName: "py-2 text-center",
      cell: (article) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Eye className="size-3" /> {article.viewCount}
        </span>
      ),
    },
    {
      id: "helpfulCount",
      header: "Hữu ích",
      sortKey: "helpfulCount",
      sortValue: (article) => article.helpfulCount,
      headClassName:
        "w-22.5 justify-center text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      cellClassName: "py-2 text-center",
      stopRowClick: true,
      cell: (article) =>
        onMarkHelpful ? (
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
        ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(article) => article.id}
      onRowClick={(article) => navigate(`/staff/kb/${article.id}`)}
    />
  );
}
