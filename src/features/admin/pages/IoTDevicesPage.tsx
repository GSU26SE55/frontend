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
import { useIotDevices } from "@/features/admin/hooks/iot/useIotDevices";
import { useSiteList } from "@/features/admin/hooks/site/useSites";
import IoTDeviceTable from "@/features/admin/components/iot/IoTDeviceTable";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

const STATUS_LABELS: Record<IotDeviceStatusEnum, string> = {
  [IotDeviceStatusEnum.Pending]: "Pending provision",
  [IotDeviceStatusEnum.Active]: "Active",
  [IotDeviceStatusEnum.Offline]: "Offline",
  [IotDeviceStatusEnum.Disabled]: "Disabled",
  [IotDeviceStatusEnum.Decommissioned]: "Decommissioned",
};

const DEFAULTS = {
  keyword: "",
  siteId: "",
  status: "",
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function IoTDevicesPage() {
  const navigate = useNavigate();
  const { filters, setFilter, setFilters, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);
  const { data: sitesData } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const { data, isLoading } = useIotDevices({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    siteId: filters.siteId || undefined,
    status: filters.status
      ? (Number(filters.status) as IotDeviceStatusEnum)
      : undefined,
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
            Admin &middot; Devices
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} devices &mdash; manage edge
            devices.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.iotDevices]} />
          <Button size="sm" onClick={() => navigate("/admin/iot-devices/new")}>
            <Plus className="size-3.5" /> Create new
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by device code / name..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.siteId || null}
          onValueChange={(v) => setFilter("siteId", v || undefined)}
          items={[
            { value: null, label: "All sites" },
            ...(sitesData?.items.map((s) => ({
              value: s.id,
              label: s.name,
            })) ?? []),
          ]}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All sites</SelectItem>
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
          items={[
            { value: null, label: "All statuses" },
            ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear filters
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
            <span className="text-sm">No devices yet.</span>
          </div>
        ) : (
          <IoTDeviceTable
            items={items}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
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
    </div>
  );
}
