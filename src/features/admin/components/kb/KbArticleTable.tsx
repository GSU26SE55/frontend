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
import {
  Eye,
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
import { noData } from "@/shared/constants/emptyStates";

const NONE_SORT = "__none__";

const SORT_ITEMS = [
  { value: "code", label: "Mã" },
  { value: "title", label: "Tiêu đề" },
  { value: "category", label: "Danh mục" },
  { value: "status", label: "Trạng thái" },
  { value: "viewCount", label: "Lượt xem" },
  { value: "helpfulCount", label: "Hữu ích" },
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
  /** Sao chép row này → tạo bài mới tương tự (mở trang create điền sẵn). */
  onCopy?: (article: KbArticleSummaryDTO) => void;
  /** Sinh blog bằng AI — BE chỉ nhận bài Published (409 nếu khác). */
  onGenerateBlog?: (article: KbArticleSummaryDTO) => void;
  basePath?: string;
  /** Sort server-side — state từ useUrlSort. */
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
  basePath = "/admin/kb",
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1">
        <span className="text-xs text-muted-foreground">Sắp xếp</span>
        <Select
          value={sort.sortBy ?? NONE_SORT}
          onValueChange={(v) =>
            sort.setSort(v && v !== NONE_SORT ? v : null, sort.sortDir)
          }
          items={[{ value: NONE_SORT, label: "Mặc định" }, ...SORT_ITEMS]}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={NONE_SORT}>Mặc định</SelectItem>
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
          title={sort.sortDir === "desc" ? "Giảm dần" : "Tăng dần"}
        >
          <ArrowUpDown className="size-3.5" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((article) => (
          <Card
            key={article.id}
            onClick={() => navigate(`${basePath}/${article.id}`)}
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
                          : navigate(`${basePath}/${article.id}/edit`)
                      }
                    >
                      Chỉnh sửa
                    </DropdownMenuItem>
                    {onCopy && (
                      <DropdownMenuItem onClick={() => onCopy(article)}>
                        Sao chép
                      </DropdownMenuItem>
                    )}
                    {article.status === KbArticleStatusEnum.Draft &&
                      onPublish && (
                        <DropdownMenuItem onClick={() => onPublish(article)}>
                          Xuất bản
                        </DropdownMenuItem>
                      )}
                    {article.status === KbArticleStatusEnum.Published &&
                      onGenerateBlog && (
                        <DropdownMenuItem
                          onClick={() => onGenerateBlog(article)}
                        >
                          Tạo blog bằng AI
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
              </div>
            </div>

            <h3 className="mt-2 line-clamp-2 text-base font-medium leading-snug">
              {article.title}
            </h3>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <KbStatusBadge status={article.status} />
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {KbCategoryLabel[article.category] ?? article.category}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-end gap-4 border-t border-border/60 pt-3">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3.5" /> {article.viewCount}
              </span>
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
