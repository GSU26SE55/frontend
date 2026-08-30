import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
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
  useStaffKbList,
  useMarkStaffKbHelpful,
  useStaffDuplicateKbArticle,
} from "@/features/staff/hooks/kb/useStaffKb";
import KbArticleTable from "@/features/staff/components/kb/KbArticleTable";
import DataPagination from "@/shared/components/ui/DataPagination";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { KbCategoryCode, KB_CATEGORY_OPTIONS } from "@/shared/enums/kb/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { loadFailed } from "@/shared/constants/emptyStates";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const DEFAULTS = {
  keyword: "",
  tag: "",
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

  const params = {
    q: filters.keyword || undefined,
    tag: filters.tag || undefined,
    category: categoryValue ? KbCategoryCode[categoryValue] : undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading, isError, refetch } = useStaffKbList(params);
  const { mutate: markHelpful } = useMarkStaffKbHelpful();
  const { mutateAsync: duplicate } = useStaffDuplicateKbArticle();

  const handleCopy = async (id: string) => {
    const created = await duplicate(id);
    if (created?.id) navigate(`/staff/kb/${created.id}/edit`);
  };

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Guide
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Guide</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} articles &mdash; look
            up handling guides.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate("/staff/kb/new")}>
            <Plus className="size-3.5" /> Create article
          </Button>
          <RefreshButton queryKeys={[KEY.kb]} />
        </div>
      </div>

      <div className="sticky top-0 z-10 ml-[calc(var(--page-pl)*-1)] mr-[calc(var(--page-pr)*-1)] pl-(--page-pl) pr-(--page-pr) bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 space-y-3">
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
                aria-label="Clear keyword"
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

          {hasActiveFilter && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {(search.value.length === 1 || tagSearch.value.length === 1) && (
          <p className="text-2xs text-muted-foreground -mt-1.5">
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
          pageNumber={filters.pageNumber}
          pageSize={filters.pageSize}
          isLoading={isLoading}
          hasFilter={hasActiveFilter}
          onResetFilter={resetFilters}
          onMarkHelpful={(a) => markHelpful(a.id)}
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
    </PageContainer>
  );
}
