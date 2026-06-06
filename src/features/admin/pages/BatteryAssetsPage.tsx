import { useState } from "react";
import { Battery, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  const handleEdit = (item: BatteryAssetDto) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Tài sản pin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Battery Assets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} pin &mdash; quản lý tài sản pin
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="size-3.5" /> Tạo mới
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo serial number..."
            value={filters.keyword}
            onChange={(e) => setFilter("keyword", e.target.value || undefined)}
            className="pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!filters.includeDeleted}
            onCheckedChange={(checked) =>
              setFilter("includeDeleted", checked === true || undefined)
            }
          />
          <span className="text-muted-foreground">Hiển thị đã xóa</span>
        </label>
        <span className="text-sm text-muted-foreground">
          {totalItems} kết quả
        </span>
        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Battery className="size-8 opacity-30" />
            <span className="text-sm">Chưa có battery asset nào.</span>
          </div>
        ) : (
          <BatteryAssetTable
            items={items}
            includeDeleted={!!filters.includeDeleted}
            onEdit={handleEdit}
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

      <BatteryAssetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editItem}
      />
    </div>
  );
}
