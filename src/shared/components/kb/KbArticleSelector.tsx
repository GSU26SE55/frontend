import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import type {
  KbArticleDTO,
  KbArticleSummaryDTO,
} from "@/shared/types/kb/kb.types";
import {
  KbArticleStatusEnum,
  KbCategoryLabel,
  KB_CATEGORY_OPTIONS,
} from "@/shared/enums/kb/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { SectionContent } from "./KbArticleDetail";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface KbArticleSearchParams {
  q?: string;
  category?: TicketCategoryEnum;
}

interface KbArticleSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
  /** List of KB articles to choose from (fetched and passed in by the parent) — used when there's no searchFn */
  options?: KbArticleSummaryDTO[];
  /** Live search across the full KB catalog (recommended) — takes priority over options when present */
  searchFn?: (params: KbArticleSearchParams) => Promise<KbArticleSummaryDTO[]>;
  disabled?: boolean;
  /** When the dialog opens, pre-filter by this category */
  defaultCategory?: TicketCategoryEnum;
  /** Fetch full detail (symptoms/diagnosis/solution/tags) for the preview panel */
  getDetailFn?: (id: string) => Promise<KbArticleDTO>;
}

export function KbArticleSelector({
  value,
  onChange,
  options = [],
  searchFn,
  disabled,
  defaultCategory,
  getDetailFn,
}: KbArticleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 400);
  const [categoryFilter, setCategoryFilter] =
    useState<TicketCategoryEnum | null>(defaultCategory ?? null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // searchFn is read through a ref — avoids the query key depending on a function
  // reference that isn't stable across renders (same pattern as useTicketCommentsRealtime).
  const searchFnRef = useRef(searchFn);
  useEffect(() => {
    searchFnRef.current = searchFn;
  });

  const getDetailFnRef = useRef(getDetailFn);
  useEffect(() => {
    getDetailFnRef.current = getDetailFn;
  });

  // Cache metadata for selected articles — so the badge outside the dialog can still
  // show code/title even when the current search results no longer include it.
  const [selectedMeta, setSelectedMeta] = useState<
    Map<string, KbArticleSummaryDTO>
  >(new Map());

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Reset category filter to default + clear preview on each open
      setCategoryFilter(defaultCategory ?? null);
      setPreviewId(null);
      setKeyword("");
    }
    setOpen(next);
  };

  const { data: searchResult, isFetching: searching } = useQuery({
    queryKey: ["kbArticleSelectorSearch", debouncedKeyword, categoryFilter],
    queryFn: () =>
      searchFnRef.current!({
        q: debouncedKeyword.trim() || undefined,
        category: categoryFilter ?? undefined,
      }),
    enabled: open && !!searchFn,
  });

  const filteredOptions: KbArticleSummaryDTO[] = useMemo(() => {
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

  const articles: KbArticleSummaryDTO[] = useMemo(
    () => (searchFn ? (searchResult ?? []) : filteredOptions),
    [searchFn, searchResult, filteredOptions],
  );

  useEffect(() => {
    if (articles.length === 0) return;
    // setState is deferred via a callback (not called synchronously in the effect body) —
    // avoids cascading renders, same pattern as react-hooks/set-state-in-effect.
    const id = setTimeout(() => {
      setSelectedMeta((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const a of articles) {
          if (value.includes(a.id) && next.get(a.id) !== a) {
            next.set(a.id, a);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 0);
    return () => clearTimeout(id);
  }, [articles, value]);

  const previewArticle = useMemo(
    () => articles.find((a) => a.id === previewId) ?? null,
    [articles, previewId],
  );

  const { data: previewDetail, isFetching: previewLoading } = useQuery({
    queryKey: ["kbArticleSelectorDetail", previewId],
    queryFn: () => getDetailFnRef.current!(previewId!),
    enabled: !!previewId && !!getDetailFn,
  });

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
            const article =
              options?.find((a) => a.id === id) ?? selectedMeta.get(id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                <Tooltip>
                  <TooltipTrigger
                    render={<span className="max-w-40 truncate text-xs" />}
                  >
                    {article?.code ?? id.slice(0, 8)}
                  </TooltipTrigger>
                  <TooltipContent>
                    {article?.title ?? article?.code ?? id}
                  </TooltipContent>
                </Tooltip>
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
          Select guide article
        </DialogTrigger>
        <DialogContent className="!w-[94vw] !max-w-260">
          <DialogHeader>
            <DialogTitle>Select guide article</DialogTitle>
          </DialogHeader>

          {/* Search + match count */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, code..."
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
                  aria-label="Clear keyword"
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
                className="h-6 text-2xs px-2"
                onClick={() => setCategoryFilter(null)}
              >
                All
              </Button>
              {KB_CATEGORY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={categoryFilter === opt.value ? "default" : "outline"}
                  className="h-6 text-2xs px-2"
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

            <p className="text-2xs text-muted-foreground">
              {searching ? "Searching..." : `${articles.length} results`}
              {value.length > 0 && ` · ${value.length} selected`}
            </p>
          </div>

          {/* Two-column body: list + preview */}
          <div className="grid gap-4 h-[58vh] min-h-90 max-h-130 md:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
            {/* Left: list */}
            <div className="overflow-y-auto scrollbar-gutter-stable space-y-1 pr-1">
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
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-3xs text-muted-foreground">
                          {KbCategoryLabel[article.category] ??
                            article.category}
                        </span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger
                          render={<p className="truncate text-sm mt-0.5" />}
                        >
                          {article.title}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          {article.title}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
              {articles.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {searching ? "Searching..." : "No articles found"}
                </div>
              )}
            </div>

            {/* Right: preview pane */}
            <div className="hidden md:flex flex-col rounded-md border border-border bg-muted/30 p-3 overflow-hidden">
              {previewArticle ? (
                <div className="space-y-3 overflow-y-auto">
                  <div className="space-y-1">
                    <p className="text-2xs font-mono text-muted-foreground">
                      {previewArticle.code}
                    </p>
                    <p className="text-sm font-semibold leading-snug">
                      {previewArticle.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-2xs font-normal">
                    {KbCategoryLabel[previewArticle.category] ??
                      previewArticle.category}
                  </Badge>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      <span className="tabular-nums font-medium">
                        {previewArticle.viewCount}
                      </span>
                      <span>views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ThumbsUp className="size-3" />
                      <span className="tabular-nums font-medium">
                        {previewArticle.helpfulCount}
                      </span>
                      <span>helpful</span>
                    </div>
                  </div>

                  {getDetailFn && (
                    <>
                      {previewLoading ? (
                        <div className="space-y-2 pt-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-4/5" />
                          <Skeleton className="h-3 w-3/5" />
                        </div>
                      ) : previewDetail ? (
                        <div className="space-y-3 pt-1">
                          <div>
                            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Content
                            </p>
                            <SectionContent text={previewDetail.content} />
                          </div>
                          {previewDetail.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {previewDetail.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-2xs font-normal px-2 py-0.5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-2 m-auto text-muted-foreground">
                  <FileText className="size-7 opacity-40" />
                  <p className="text-xs">Select an article to preview</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
