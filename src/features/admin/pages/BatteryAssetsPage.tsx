import { useState } from "react";
import { Battery, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatteryAssets } from "@/features/admin/hooks/battery/useBatteryAssets";
import { useBatteryTypes } from "@/features/admin/hooks/battery/useBatteryTypes";
import { useCustomers } from "@/features/admin/hooks/account/useCustomers";
import { useSiteList } from "@/features/admin/hooks/site/useSites";
import BatteryAssetTable from "@/features/admin/components/battery/BatteryAssetTable";
import BatteryAssetForm from "@/features/admin/components/battery/BatteryAssetForm";
import type { BatteryAssetDto } from "@/features/admin/types/battery/battery-asset.types";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { loadFailed, noData } from "@/shared/constants/emptyStates";

const STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Tạm ngừng",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

const DEFAULTS = {
  keyword: "",
  customerId: "",
  batteryTypeId: "",
  siteId: "",
  status: "",
  includeDeleted: false,
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function BatteryAssetsPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilter);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<BatteryAssetDto | null>(null);

  // Data cho các dropdown filter
  const { data: customersData } = useCustomers({ pageSize: 100 });
  const { data: batteryTypesData } = useBatteryTypes({ pageSize: 100 });
  const { data: sitesData } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const { data, isLoading, isError, refetch } = useBatteryAssets({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    customerId: filters.customerId || undefined,
    batteryTypeId: filters.batteryTypeId || undefined,
    siteId: filters.siteId || undefined,
    status: filters.status
      ? (Number(filters.status) as BatteryStatusEnum)
      : undefined,
    includeDeleted: filters.includeDeleted || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
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
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Tài sản pin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Battery Assets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} pin &mdash; quản lý tài sản pin.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.batteryAssets]} />
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-3.5" /> Tạo mới
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo serial number..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.customerId || null}
          items={[
            { value: null, label: "Tất cả khách hàng" },
            ...(customersData?.items.map((c) => ({
              value: c.id,
              label: c.fullName,
            })) ?? []),
          ]}
          onValueChange={(v) => setFilter("customerId", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="Khách hàng" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả khách hàng</SelectItem>
            {customersData?.items.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.batteryTypeId || null}
          items={[
            { value: null, label: "Tất cả loại pin" },
            ...(batteryTypesData?.items.map((t) => ({
              value: t.id,
              label: t.name,
            })) ?? []),
          ]}
          onValueChange={(v) => setFilter("batteryTypeId", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Loại pin" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả loại pin</SelectItem>
            {batteryTypesData?.items.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.siteId || null}
          items={[
            { value: null, label: "Tất cả site" },
            ...(sitesData?.items.map((s) => ({
              value: s.id,
              label: s.name,
            })) ?? []),
          ]}
          onValueChange={(v) => setFilter("siteId", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả site</SelectItem>
            {sitesData?.items.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || null}
          items={[
            { value: null, label: "Mọi trạng thái" },
            ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onValueChange={(v) => setFilter("status", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Mọi trạng thái</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!filters.includeDeleted}
            onCheckedChange={(checked) =>
              setFilter("includeDeleted", checked === true || undefined)
            }
          />
          <span className="text-muted-foreground">Hiển thị đã xóa</span>
        </label>
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
        ) : isError ? (
          <ErrorState
            message={loadFailed("battery asset")}
            onRetry={() => refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState icon={Battery} title={noData("battery asset")} />
        ) : (
          <BatteryAssetTable
            items={items}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
            includeDeleted={!!filters.includeDeleted}
            onEdit={handleEdit}
            sort={sort}
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
