import { MapPin, Search } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { useSiteList } from "@/features/manager/hooks/useSites";
import SiteTable from "@/features/manager/components/SiteTable";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { loadFailed, noData } from "@/shared/constants/emptyStates";

const DEFAULTS = {
  keyword: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function ManagerSiteListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  const { data, isLoading, isError, refetch } = useSiteList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
  });
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Manager &middot; Tài sản
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Danh sách Site
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} site &mdash; quản lý site khách
            hàng.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.sites]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên site..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>
        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={loadFailed("site")} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={MapPin} title={noData("site")} />
        ) : (
          <SiteTable
            data={items}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
          />
        )}
      </Card>

      <DataPagination
        totalItems={totalItems}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />
    </div>
  );
}
