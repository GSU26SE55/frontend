import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Tag, X } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import {
  useManagerKbList,
  useManagerPublishKbArticle,
  useManagerArchiveKbArticle,
  useMarkManagerKbHelpful,
  useManagerDuplicateKbArticle,
} from "@/features/manager/hooks/kb/useManagerKb";
import KbArticleTable from "@/features/manager/components/kb/KbArticleTable";
import DataPagination from "@/shared/components/ui/DataPagination";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
  KbCategoryCode,
  KB_CATEGORY_OPTIONS,
} from "@/shared/enums/kb/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { toneDot, KB_STATUS_TONE } from "@/shared/theme/statusColors";
import { cn } from "@/lib/utils";
import { loadFailed } from "@/shared/constants/emptyStates";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = Object.values(KbArticleStatusEnum);

const STATUS_DOT: Record<KbArticleStatusEnum, string> = {
  [KbArticleStatusEnum.Draft]: toneDot(KB_STATUS_TONE.Draft),
  [KbArticleStatusEnum.PendingReview]: toneDot(KB_STATUS_TONE.PendingReview),
  [KbArticleStatusEnum.Published]: toneDot(KB_STATUS_TONE.Published),
  [KbArticleStatusEnum.Archived]: toneDot(KB_STATUS_TONE.Archived),
};

const DEFAULTS = {
  keyword: "",
  tag: "",
  status: "",
  category: "",
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

export default function KbListPage() {
  const navigate = useNavigate();
  const { filters, setFilter, setFilters, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const tagSearch = useDebouncedSearch(filters.tag ?? "", (t) =>
    setFilter("tag", t),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);

  const categoryValue = filters.category
    ? (filters.category as TicketCategoryEnum)
    : undefined;
  const statusValue = filters.status
    ? (filters.status as KbArticleStatusEnum)
    : undefined;

  const params = {
    q: filters.keyword || undefined,
    tag: filters.tag || undefined,
    status: statusValue,
    category: categoryValue ? KbCategoryCode[categoryValue] : undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading, isError, refetch } = useManagerKbList(params);
  const { mutate: publish } = useManagerPublishKbArticle();
  const { mutate: archive } = useManagerArchiveKbArticle();
  const { mutate: markHelpful } = useMarkManagerKbHelpful();
  const { mutateAsync: duplicate } = useManagerDuplicateKbArticle();

  const handleCopy = async (id: string) => {
    const created = await duplicate(id);
    if (created?.id) navigate(`/manager/kb/${created.id}/edit`);
  };

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Manager &middot; Knowledge Base
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} articles &mdash;
            manage the knowledge base.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.kb]} />
          <Button size="sm" onClick={() => navigate("/manager/kb/new")}>
            <Plus className="size-3.5" /> New article
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or code…"
              value={search.value}
              onChange={search.onChange}
              className="pl-8 pr-8"
            />
            {search.value && (
              <button
                type="button"
                onClick={() => {
                  search.onChange({
                    target: { value: "" },
                  } as React.ChangeEvent<HTMLInputElement>);
                  setFilter("keyword", undefined);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-44">
            <Tag className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by tag…"
              value={tagSearch.value}
              onChange={tagSearch.onChange}
              className="pl-8 pr-8"
            />
            {tagSearch.value && (
              <button
                type="button"
                onClick={() => {
                  tagSearch.onChange({
                    target: { value: "" },
                  } as React.ChangeEvent<HTMLInputElement>);
                  setFilter("tag", undefined);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
                aria-label="Clear tag"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select
            value={filters.category || null}
            onValueChange={(v: string | null) =>
              setFilter("category", v || undefined)
            }
            items={[
              { value: null, label: "All categories" },
              ...KB_CATEGORY_OPTIONS,
            ]}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={null}>All categories</SelectItem>
              {KB_CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || null}
            onValueChange={(v: string | null) =>
              setFilter("status", v || undefined)
            }
            items={[
              { value: null, label: "All statuses" },
              ...STATUS_OPTIONS.map((s) => ({
                value: s,
                label: KbArticleStatusLabel[s],
              })),
            ]}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={null}>All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        STATUS_DOT[s],
                      )}
                    />
                    {KbArticleStatusLabel[s]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilter && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {(search.value.length === 1 || tagSearch.value.length === 1) && (
          <p className="text-[11px] text-muted-foreground -mt-1.5">
            Enter at least 2 characters to search
          </p>
        )}
      </div>

      {isError ? (
        <ErrorState
          message={loadFailed("articles")}
          onRetry={() => refetch()}
        />
      ) : (
        <KbArticleTable
          data={data?.items ?? []}
          isLoading={isLoading}
          hasFilter={hasActiveFilter}
          onResetFilter={resetFilters}
          onPublish={(a) => publish(a.id)}
          onArchive={(a) => archive(a.id)}
          onMarkHelpful={(a) => markHelpful(a.id)}
          onEdit={(a) => navigate(`/manager/kb/${a.id}/edit`)}
          onCopy={(a) => handleCopy(a.id)}
          sort={sort}
        />
      )}

      {data && (
        <DataPagination
          totalItems={data.totalItems}
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={(p) => setFilter("pageNumber", p)}
          onPageSizeChange={(s) => setFilter("pageSize", s)}
        />
      )}
    </div>
  );
}
