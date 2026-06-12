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
import { BookOpen, Search, X } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";
import { MOCK_KB_SUMMARIES } from "@/shared/mocks/kb.mock";

interface KbArticleSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function KbArticleSelector({
  value,
  onChange,
  disabled,
}: KbArticleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const articles: KbArticleSummaryDTO[] = useMemo(() => {
    const published = MOCK_KB_SUMMARIES.filter(
      (a) => a.status === KbArticleStatusEnum.Published,
    );
    if (!keyword) return published;
    const kw = keyword.toLowerCase();
    return published.filter(
      (a) =>
        a.title.toLowerCase().includes(kw) ||
        a.code.toLowerCase().includes(kw),
    );
  }, [keyword]);

  const toggle = useCallback(
    (id: string) => {
      onChange(
        value.includes(id)
          ? value.filter((v) => v !== id)
          : [...value, id],
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
            const article = articles?.find((a) => a.id === id);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-1.5"
          >
            <BookOpen className="size-3.5" />
            Chọn bài KB
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn bài viết Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề, mã..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[300px] space-y-1 overflow-y-auto">
            {articles?.map((article) => (
              <label
                key={article.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <Checkbox
                  checked={value.includes(article.id)}
                  onCheckedChange={() => toggle(article.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      {article.code}
                    </span>
                  </div>
                  <p className="truncate text-sm">{article.title}</p>
                </div>
              </label>
            ))}
            {articles?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy bài viết
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
