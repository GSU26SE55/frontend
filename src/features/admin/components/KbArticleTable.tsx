import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KbStatusBadge } from "@/shared/components/common/kb/KbStatusBadge";
import { Eye, ThumbsUp, EllipsisVertical, BookOpen } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import { KbArticleStatusEnum, KbCategoryLabel } from "@/shared/enums/kb.enum";

interface KbArticleTableProps {
  data: KbArticleSummaryDTO[];
  isLoading?: boolean;
  pageNumber: number;
  pageSize: number;
  hasFilter?: boolean;
  onResetFilter?: () => void;
  onPublish?: (article: KbArticleSummaryDTO) => void;
  onArchive?: (article: KbArticleSummaryDTO) => void;
  onDelete?: (article: KbArticleSummaryDTO) => void;
  onMarkHelpful?: (article: KbArticleSummaryDTO) => void;
  onEdit?: (article: KbArticleSummaryDTO) => void;
  basePath?: string;
}

export default function KbArticleTable({
  data,
  isLoading,
  pageNumber,
  pageSize,
  hasFilter,
  onResetFilter,
  onPublish,
  onArchive,
  onDelete,
  onMarkHelpful,
  onEdit,
  basePath = "/admin/kb",
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
          <TableHead className="w-12 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            STT
          </TableHead>
          <TableHead className="w-25 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Mã
          </TableHead>
          <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Tiêu đề
          </TableHead>
          <TableHead className="w-27.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Danh mục
          </TableHead>
          <TableHead className="w-30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Trạng thái
          </TableHead>
          <TableHead className="w-22.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Lượt xem
          </TableHead>
          <TableHead className="w-22.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hữu ích
          </TableHead>
          <TableHead className="w-20 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((article, index) => (
          <TableRow
            key={article.id}
            className="cursor-pointer h-11 hover:bg-muted/40"
            onClick={() => navigate(`${basePath}/${article.id}`)}
          >
            <TableCell className="py-2 text-center text-muted-foreground tabular-nums text-[11px]">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
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
            <TableCell
              className="py-2 text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-7" />
                  }
                >
                  <EllipsisVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      onEdit
                        ? onEdit(article)
                        : navigate(`${basePath}/${article.id}/edit`)
                    }
                  >
                    Chỉnh sửa
                  </DropdownMenuItem>
                  {article.status === KbArticleStatusEnum.Draft &&
                    onPublish && (
                      <DropdownMenuItem onClick={() => onPublish(article)}>
                        Xuất bản
                      </DropdownMenuItem>
                    )}
                  {article.status === KbArticleStatusEnum.Published &&
                    onArchive && (
                      <DropdownMenuItem onClick={() => onArchive(article)}>
                        Lưu trữ
                      </DropdownMenuItem>
                    )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(article)}
                      >
                        Xóa
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
