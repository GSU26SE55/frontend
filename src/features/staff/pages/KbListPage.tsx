import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { useStaffKbList } from "../hooks/useStaffKb";
import KbArticleTable from "../components/KbArticleTable";
import DataPagination from "@/shared/components/common/DataPagination";

const PAGE_SIZE = 10;

const DEFAULTS = {
  keyword: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

export default function KbListPage() {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  const params = {
    q: filters.keyword || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading } = useStaffKbList(params);

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Knowledge Base
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} bài viết &mdash; tra
            cứu hướng dẫn xử lý
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.kb]} />
          <Button size="sm" onClick={() => navigate("/staff/kb/new")}>
            <Plus className="size-3.5" /> Tạo bài viết
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề, mã..."
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
        <KbArticleTable
          data={data?.items ?? []}
          isLoading={isLoading}
          pageNumber={data?.pageNumber ?? 1}
          pageSize={data?.pageSize ?? 10}
        />
      </Card>

      {data && (
        <DataPagination
          totalItems={data.totalItems}
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={(p) => setFilter("pageNumber", p)}
        />
      )}
    </div>
  );
}
