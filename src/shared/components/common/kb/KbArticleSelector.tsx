import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Eye, FileText, Search, ThumbsUp, X } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import {
  KbArticleStatusEnum,
  KbCategoryLabel,
  KB_CATEGORY_OPTIONS,
} from "@/shared/enums/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket.enum";
import { cn } from "@/lib/utils";

interface KbArticleSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
  /** Danh sách bài KB để chọn (parent fetch và truyền vào) */
  options?: KbArticleSummaryDTO[];
  disabled?: boolean;
  /** Khi mở dialog, pre-filter theo category này */
  defaultCategory?: TicketCategoryEnum;
}

export function KbArticleSelector({
  value,
  onChange,
  options = [],
  disabled,
  defaultCategory,
}: KbArticleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<TicketCategoryEnum | null>(defaultCategory ?? null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Reset category filter to default + clear preview on each open
      setCategoryFilter(defaultCategory ?? null);
      setPreviewId(null);
    }
    setOpen(next);
  };

  const articles: KbArticleSummaryDTO[] = useMemo(() => {
    let list = options.filter(
      (a) => a.status === KbArticleStatusEnum.Published,
    );
    if (categoryFilter) {
      list = list.filter((a) => a.category === categoryFilter);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(kw) ||
          a.code.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [keyword, options, categoryFilter]);

  const previewArticle = useMemo(
    () => articles.find((a) => a.id === previewId) ?? null,
    [articles, previewId],
  );

  const toggle = useCallback(
    (id: string) => {
      onChange(
        value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
      );
    },
    [value, onChange],
  );

  const removeId = useCallback(
    (id: string) => {
      onChange(value.filter((v) => v !== id));
    },
    [value, onChange],
  );

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((id) => {
            const article = options?.find((a) => a.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                <span className="max-w-[160px] truncate text-xs">
                  {article?.code ?? id.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => removeId(id)}
                  className="ml-0.5 rounded hover:bg-muted-foreground/20"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-1.5"
            />
          }
        >
          <BookOpen className="size-3.5" />
          Chọn bài KB
        </DialogTrigger>
        <DialogContent className="!w-[94vw] !max-w-[1040px]">
          <DialogHeader>
            <DialogTitle>Chọn bài viết Knowledge Base</DialogTitle>
          </DialogHeader>

          {/* Search + match count */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề, mã..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-8 pr-8"
                autoFocus
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
                  aria-label="Xóa từ khóa"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={!categoryFilter ? "default" : "outline"}
                className="h-6 text-[11px] px-2"
                onClick={() => setCategoryFilter(null)}
              >
                Tất cả
              </Button>
              {KB_CATEGORY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={categoryFilter === opt.value ? "default" : "outline"}
                  className="h-6 text-[11px] px-2"
                  onClick={() =>
                    setCategoryFilter(
                      categoryFilter === opt.value ? null : opt.value,
                    )
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {articles.length} kết quả
              {value.length > 0 && ` · đã chọn ${value.length}`}
            </p>
          </div>

          {/* Two-column body: list + preview */}
          <div className="grid gap-4 h-[58vh] min-h-[360px] max-h-[520px] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {/* Left: list */}
            <div className="overflow-y-auto space-y-1 pr-1">
              {articles.map((article) => {
                const isPreview = previewId === article.id;
                const isSelected = value.includes(article.id);
                return (
                  <div
                    key={article.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors",
                      isPreview && "bg-muted border-border",
                      !isPreview && "hover:bg-muted/60",
                    )}
                    onClick={() => setPreviewId(article.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(article.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 whitespace-nowrap text-xs font-mono text-muted-foreground">
                          {article.code}
                        </span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {KbCategoryLabel[article.category] ??
                            article.category}
                        </span>
                      </div>
                      <p className="truncate text-sm mt-0.5">{article.title}</p>
                    </div>
                  </div>
                );
              })}
              {articles.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Không tìm thấy bài viết
                </div>
              )}
            </div>

            {/* Right: preview pane */}
            <div className="hidden md:flex flex-col rounded-md border border-border bg-muted/30 p-3 overflow-hidden">
              {previewArticle ? (
                <div className="space-y-3 overflow-y-auto">
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono text-muted-foreground">
                      {previewArticle.code}
                    </p>
                    <p className="text-sm font-semibold leading-snug">
                      {previewArticle.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {KbCategoryLabel[previewArticle.category] ??
                      previewArticle.category}
                  </Badge>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      <span className="tabular-nums font-medium">
                        {previewArticle.viewCount}
                      </span>
                      <span>lượt xem</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ThumbsUp className="size-3" />
                      <span className="tabular-nums font-medium">
                        {previewArticle.helpfulCount}
                      </span>
                      <span>hữu ích</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-2 m-auto text-muted-foreground">
                  <FileText className="size-7 opacity-40" />
                  <p className="text-xs">Chọn 1 bài để xem trước</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
