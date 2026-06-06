import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBatteryAssets } from "@/features/admin/hooks/useBatteryAssets";
import BatteryAssetTable from "@/features/admin/components/BatteryAssetTable";
import BatteryAssetForm from "@/features/admin/components/BatteryAssetForm";
import type { BatteryAssetDto } from "@/features/admin/types/battery-asset.types";
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const DEFAULTS = {
  keyword: "",
  includeDeleted: false,
  pageNumber: 1,
  pageSize: 10,
};

export default function BatteryAssetsPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<BatteryAssetDto | null>(null);

  const { data, isLoading } = useBatteryAssets({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    includeDeleted: filters.includeDeleted || undefined,
  });

  const handleEdit = (item: BatteryAssetDto) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Battery Assets</h1>
        <Button onClick={handleCreate}>+ Tạo mới</Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm theo serial number..."
          value={filters.keyword}
          onChange={(e) => setFilter("keyword", e.target.value || undefined)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.includeDeleted}
            onChange={(e) =>
              setFilter("includeDeleted", e.target.checked || undefined)
            }
          />
          Hiện đã xóa
        </label>
        <span className="text-sm text-muted-foreground">
          {data?.totalItems ?? 0} kết quả
        </span>
        {hasActiveFilter && (
          <Button variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <BatteryAssetTable
          items={data?.items ?? []}
          includeDeleted={!!filters.includeDeleted}
          onEdit={handleEdit}
        />
      )}

      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />

      <BatteryAssetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editItem}
      />
    </div>
  );
}
