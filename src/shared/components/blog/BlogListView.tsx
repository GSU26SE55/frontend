import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, X } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import DataPagination from "@/shared/components/ui/DataPagination";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { useBlogList } from "@/shared/hooks/blog/useBlog";
import { BlogStatusBadge, BlogOriginBadge } from "./BlogStatusBadge";
import {
  BLOG_STATUS_OPTIONS,
  BLOG_ORIGIN_OPTIONS,
  type BlogPostStatusEnum,
  type BlogPostOriginEnum,
} from "@/shared/enums/blog/blog.enum";
import { loadFailed, noData } from "@/shared/constants/emptyStates";

const PAGE_SIZE = 10;

// Base UI Select renders the raw VALUE if Root doesn't receive an `items` value→label map.
// Without this prop the filter shows "Draft"/"Published" instead of the display label.
const STATUS_ITEMS = [
  { value: null, label: "All statuses" },
  ...BLOG_STATUS_OPTIONS,
];
const ORIGIN_ITEMS = [
  { value: null, label: "All origins" },
  ...BLOG_ORIGIN_OPTIONS,
];

// Uses `pageNumber` (same as KB) — `setFilter` only auto-resets to page 1 for this exact
// key. Blog previously used the name `page`, so changing a filter did NOT reset the page,
// and the service also sent the wrong param `Page`, which the BE ignored → pagination broke.
const DEFAULTS = {
  keyword: "",
  status: "",
  origin: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

interface BlogListViewProps {
  /** Role route prefix, e.g. "/staff". */
  basePath: string;
  /** Breadcrumb label, e.g. "Staff". */
  roleLabel: string;
}

export function BlogListView({ basePath, roleLabel }: BlogListViewProps) {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  // BE filters by `Q` (Title/Summary) — searches ACROSS ALL posts, not just the current page.
  const { data, isLoading, isError, refetch } = useBlogList({
    status: (filters.status || undefined) as BlogPostStatusEnum | undefined,
    origin: (filters.origin || undefined) as BlogPostOriginEnum | undefined,
    page: filters.pageNumber,
    pageSize: filters.pageSize,
    q: filters.keyword || undefined,
  });

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-360 space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs font-medium">
            {roleLabel} &middot; Blog
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading ? "..." : (data?.totalItems ?? 0)} posts
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.blog]} />
          <Button size="sm" onClick={() => navigate(`${basePath}/blog/new`)}>
            <Plus className="size-3.5" /> Create post
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search by title or summary…"
            value={search.value}
            onChange={search.onChange}
            className="pr-8 pl-8"
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
              className="hover:bg-muted absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
              aria-label="Clear keyword"
            >
              <X className="text-muted-foreground size-3.5" />
            </button>
          )}
        </div>

        <Select
          value={filters.status || null}
          items={STATUS_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All statuses</SelectItem>
            {BLOG_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.origin || null}
          items={ORIGIN_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("origin", v || undefined)
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All origins" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All origins</SelectItem>
            {BLOG_ORIGIN_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState message={loadFailed("blog posts")} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {filters.keyword
            ? `No posts found matching "${filters.keyword}".`
            : noData("blog posts")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => (
            <Card
              key={b.id}
              onClick={() => navigate(`${basePath}/blog/${b.id}`)}
              className="hover:bg-accent/40 cursor-pointer p-4 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <BlogStatusBadge status={b.status} />
                <BlogOriginBadge origin={b.origin} />
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug">
                {b.title}
              </h3>
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {b.summary}
              </p>
              <p className="text-muted-foreground mt-3 border-t border-border/60 pt-2.5 font-mono text-[11px]">
                /{b.slug} &middot; v{b.currentVersion} &middot;{" "}
                {format(new Date(b.createdAt), "MM/dd/yyyy")}
              </p>
            </Card>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
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
