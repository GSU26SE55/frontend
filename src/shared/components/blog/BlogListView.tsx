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

// Base UI Select render VALUE thô nếu Root không nhận `items` map value→label.
// Thiếu prop này thì filter hiện "Draft"/"Published" thay vì nhãn tiếng Việt.
const STATUS_ITEMS = [
  { value: null, label: "Mọi trạng thái" },
  ...BLOG_STATUS_OPTIONS,
];
const ORIGIN_ITEMS = [
  { value: null, label: "Mọi nguồn" },
  ...BLOG_ORIGIN_OPTIONS,
];

const DEFAULTS = {
  keyword: "",
  status: "",
  origin: "",
  page: 1,
  pageSize: PAGE_SIZE,
};

interface BlogListViewProps {
  /** Tiền tố route của role, vd "/staff". */
  basePath: string;
  /** Nhãn breadcrumb, vd "Staff". */
  roleLabel: string;
}

export function BlogListView({ basePath, roleLabel }: BlogListViewProps) {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  // ⚠️ Blog dùng `page` (KB dùng `pageNumber`) — response vẫn trả `pageNumber`.
  const { data, isLoading, isError, refetch } = useBlogList({
    status: (filters.status || undefined) as BlogPostStatusEnum | undefined,
    origin: (filters.origin || undefined) as BlogPostOriginEnum | undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  // BE `GetBlogPostListQuery` không có param từ khóa (chỉ Status/Origin/Page/PageSize)
  // → chỉ lọc được trong trang đang xem. Nhãn ô input nói rõ điều đó để người dùng
  // không tưởng là tìm toàn bộ.
  const keyword = (filters.keyword ?? "").trim().toLowerCase();
  const items = (data?.items ?? []).filter(
    (b) =>
      !keyword ||
      b.title.toLowerCase().includes(keyword) ||
      b.summary.toLowerCase().includes(keyword),
  );

  return (
    <div className="mx-auto max-w-360 space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs font-medium">
            {roleLabel} &middot; Blog
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading ? "..." : (data?.totalItems ?? 0)} bài viết
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.blog]} />
          <Button size="sm" onClick={() => navigate(`${basePath}/blog/new`)}>
            <Plus className="size-3.5" /> Tạo bài viết
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Lọc trong trang này…"
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
              aria-label="Xóa từ khóa"
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
            <SelectValue placeholder="Mọi trạng thái" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Mọi trạng thái</SelectItem>
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
            <SelectValue placeholder="Mọi nguồn" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Mọi nguồn</SelectItem>
            {BLOG_ORIGIN_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Xóa lọc
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState message={loadFailed("bài blog")} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {keyword
            ? "Không có bài nào khớp trong trang này. Thử chuyển trang hoặc lọc theo trạng thái."
            : noData("bài blog")}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <Card
              key={b.id}
              onClick={() => navigate(`${basePath}/blog/${b.id}`)}
              className="hover:bg-accent/40 cursor-pointer p-4 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">{b.title}</h3>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                    {b.summary}
                  </p>
                  <p className="text-muted-foreground mt-1.5 font-mono text-[11px]">
                    /{b.slug} &middot; v{b.currentVersion} &middot;{" "}
                    {format(new Date(b.createdAt), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <BlogStatusBadge status={b.status} />
                  <BlogOriginBadge origin={b.origin} />
                </div>
              </div>
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
          onPageChange={(p) => setFilter("page", p)}
          onPageSizeChange={(s) => setFilter("pageSize", s)}
        />
      )}
    </div>
  );
}
