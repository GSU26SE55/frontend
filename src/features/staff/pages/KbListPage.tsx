import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useStaffKbList } from "../hooks/useStaffKb";
import KbArticleTable from "../components/KbArticleTable";
import DataPagination from "@/shared/components/common/DataPagination";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";

const PAGE_SIZE = 10;

const DEFAULTS = {
  keyword: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

export default function KbListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const params = {
    keyword: filters.keyword || undefined,
    status: KbArticleStatusEnum.Published,
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
        </div>
        <RefreshButton queryKeys={[KEY.kb]} />
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Tìm theo tiêu đề, mã..."
          value={filters.keyword ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilter("keyword", e.target.value || undefined)
          }
          className="w-64"
        />

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="size-3.5 mr-1" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <KbArticleTable data={data?.items ?? []} isLoading={isLoading} />

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
