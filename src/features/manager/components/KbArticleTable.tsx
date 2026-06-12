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
import { KbStatusBadge } from "@/shared/components/common/kb/KbStatusBadge";
import { Eye, ThumbsUp, Pencil, Trash2, Upload, Archive } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";

interface KbArticleTableProps {
  data: KbArticleSummaryDTO[];
  isLoading?: boolean;
  onPublish?: (article: KbArticleSummaryDTO) => void;
  onArchive?: (article: KbArticleSummaryDTO) => void;
  onDelete?: (article: KbArticleSummaryDTO) => void;
}

export default function KbArticleTable({
  data,
  isLoading,
  onPublish,
  onArchive,
  onDelete,
}: KbArticleTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Chưa có bài viết nào.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Mã</TableHead>
          <TableHead>Tiêu đề</TableHead>
          <TableHead className="w-[120px]">Trạng thái</TableHead>
          <TableHead className="w-[100px] text-center">Lượt xem</TableHead>
          <TableHead className="w-[100px] text-center">Hữu ích</TableHead>
          <TableHead className="w-[120px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((article) => (
          <TableRow
            key={article.id}
            className="cursor-pointer"
            onClick={() => navigate(`/manager/kb/${article.id}`)}
          >
            <TableCell className="font-mono text-xs text-muted-foreground">
              {article.code}
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <p className="text-sm font-medium">{article.title}</p>
                {article.tags.length > 0 && (
                  <div className="flex gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <KbStatusBadge status={article.status} />
            </TableCell>
            <TableCell className="text-center">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3" /> {article.viewCount}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ThumbsUp className="size-3" /> {article.helpfulCount}
              </span>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => navigate(`/manager/kb/${article.id}/edit`)}
                  title="Sửa"
                >
                  <Pencil className="size-3.5" />
                </Button>
                {article.status === KbArticleStatusEnum.Draft && onPublish && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onPublish(article)}
                    title="Xuất bản"
                  >
                    <Upload className="size-3.5" />
                  </Button>
                )}
                {article.status === KbArticleStatusEnum.Published &&
                  onArchive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onArchive(article)}
                      title="Lưu trữ"
                    >
                      <Archive className="size-3.5" />
                    </Button>
                  )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => onDelete(article)}
                    title="Xóa"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
