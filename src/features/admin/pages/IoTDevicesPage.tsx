import { Cpu, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIotDevices } from "@/features/admin/hooks/useIotDevices";
import { useSiteList } from "@/features/admin/hooks/useSites";
import IoTDeviceTable from "@/features/admin/components/IoTDeviceTable";
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { IotDeviceStatusEnum } from "@/shared/enums/iot.enum";

const STATUS_LABELS: Record<IotDeviceStatusEnum, string> = {
  [IotDeviceStatusEnum.Pending]: "Chờ provision",
  [IotDeviceStatusEnum.Active]: "Hoạt động",
  [IotDeviceStatusEnum.Offline]: "Offline",
  [IotDeviceStatusEnum.Disabled]: "Vô hiệu hóa",
  [IotDeviceStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

const DEFAULTS = {
  keyword: "",
  siteId: "",
  status: "",
  page: 1,
  pageSize: 10,
};

export default function IoTDevicesPage() {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const { data: sitesData } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const { data, isLoading } = useIotDevices({
    page: filters.page,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    siteId: filters.siteId || undefined,
    status: filters.status
      ? (Number(filters.status) as IotDeviceStatusEnum)
      : undefined,
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
          <h1 className="text-2xl font-semibold tracking-tight">IoT Devices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} thiết bị &mdash; quản lý edge
            device
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.iotDevices]} />
          <Button size="sm" onClick={() => navigate("/admin/iot-devices/new")}>
            <Plus className="size-3.5" /> Tạo mới
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo device code / tên..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.siteId || null}
          onValueChange={(v) => setFilter("siteId", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-44">
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
          onValueChange={(v) => setFilter("status", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-40">
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
            <Cpu className="size-8 opacity-30" />
            <span className="text-sm">Chưa có thiết bị IoT nào.</span>
          </div>
        ) : (
          <IoTDeviceTable
            items={items}
            pageNumber={filters.page}
            pageSize={filters.pageSize}
          />
        )}
      </Card>

      <DataPagination
        totalItems={totalItems}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("page", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />
    </div>
  );
}
