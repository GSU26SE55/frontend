import { HardDrive, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useIotFirmware } from "@/features/admin/hooks/iot/useIotFirmware";
import IoTFirmwareTable from "@/features/admin/components/iot/IoTFirmwareTable";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

const DEFAULTS = {
  hardwareRevision: "",
  publishedOnly: false,
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function IoTFirmwareReleasesPage() {
  const navigate = useNavigate();
  const { filters, setFilter, setFilters, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.hardwareRevision ?? "", (kw) =>
    setFilter("hardwareRevision", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);

  const { data, isLoading } = useIotFirmware({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    hardwareRevision: filters.hardwareRevision || undefined,
    publishedOnly: filters.publishedOnly || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
  });
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; IoT
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Firmware Releases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} release &mdash; quản lý OTA
            firmware.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.iotFirmware]} />
          <Button size="sm" onClick={() => navigate("/admin/iot-firmware/new")}>
            <Plus className="size-3.5" /> Tạo release
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Lọc theo hardware revision..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!filters.publishedOnly}
            onCheckedChange={(checked) =>
              setFilter("publishedOnly", checked === true || undefined)
            }
          />
          <span className="text-muted-foreground">Chỉ đã publish</span>
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
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <HardDrive className="size-8 opacity-30" />
            <span className="text-sm">Chưa có firmware release nào.</span>
          </div>
        ) : (
          <IoTFirmwareTable items={items} sort={sort} />
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
