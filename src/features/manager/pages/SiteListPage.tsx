import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteList } from "@/features/manager/hooks/useSites";
import SiteTable from "@/features/manager/components/SiteTable";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const DEFAULTS = {
  keyword: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function ManagerSiteListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const { data, isLoading } = useSiteList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
  });

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Danh sách Site</h1>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm theo tên site..."
          value={filters.keyword}
          onChange={(e) => setFilter("keyword", e.target.value || undefined)}
          className="max-w-sm"
        />
        {hasActiveFilter && (
          <Button variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <SiteTable
        data={data?.items ?? []}
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        isLoading={isLoading}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />
    </div>
  );
}
