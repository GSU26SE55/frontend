import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DataPagination from "@/shared/components/ui/DataPagination";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import {
  BatteryStatusEnum,
  type BatteryAssetDto,
} from "@/shared/types/battery/battery.types";
import { toneClass } from "@/shared/theme/statusColors";
import { useIotDevicesForStaff } from "@/shared/hooks/iot/useIotDeviceRead";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

const STATUS_LABEL: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Inactive",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
};

const STATUS_VARIANT: Record<
  BatteryStatusEnum,
  "default" | "secondary" | "destructive"
> = {
  [BatteryStatusEnum.Active]: "default",
  [BatteryStatusEnum.Inactive]: "secondary",
  [BatteryStatusEnum.Decommissioned]: "destructive",
};

interface SiteAssetsTableProps {
  siteId: string;
  data: BatteryAssetDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** Click a battery → open details. Omit → row isn't clickable. */
  onAssetClick?: (asset: BatteryAssetDto) => void;
}

export default function SiteAssetsTable({
  siteId,
  data,
  totalCount,
  pageNumber,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onAssetClick,
}: SiteAssetsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const { data: gateways } = useIotDevicesForStaff(
    { siteId, pageNumber: 1, pageSize: 100 },
    !!siteId,
  );
  const gatewayItems = gateways?.items ?? [];
  const gatewayOnline = gatewayItems.some(
    (device) => device.status === IotDeviceStatusEnum.Active,
  );
  const gatewayConnecting = gatewayItems.some(
    (device) => device.status === IotDeviceStatusEnum.Pending,
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No batteries yet.
      </p>
    );
  }

  const columns: ColumnDef<BatteryAssetDto>[] = [
    {
      id: "serialNumber",
      header: "Serial number",
      cell: (asset) => asset.serialNumber,
      cellClassName: "font-mono text-sm",
    },
    {
      id: "batteryTypeName",
      header: "Battery type",
      cell: (asset) => asset.batteryTypeName,
    },
    {
      id: "status",
      header: "Lifecycle",
      cell: (asset) => (
        <Badge variant={STATUS_VARIANT[asset.status]}>
          {STATUS_LABEL[asset.status]}
        </Badge>
      ),
    },
    {
      id: "connectivity",
      header: "Connection",
      cell: () => {
        if (!gateways) {
          return (
            <span className="text-xs text-muted-foreground">Checking...</span>
          );
        }
        if (gatewayOnline) {
          return (
            <Badge variant="outline" className={toneClass("ok")}>
              Gateway online
            </Badge>
          );
        }
        if (gatewayConnecting) {
          return (
            <Badge variant="outline" className={toneClass("p2")}>
              Connecting
            </Badge>
          );
        }
        if (gatewayItems.length > 0) {
          return (
            <Badge
              variant="outline"
              className={toneClass("p3")}
              title="The site's IoT gateway is offline"
            >
              Gateway offline
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className={toneClass("muted")}>
            No gateway
          </Badge>
        );
      },
    },
    {
      id: "installDate",
      header: "Install date",
      cell: (asset) => format(new Date(asset.installDate), "MM/dd/yyyy"),
    },
    {
      id: "lastSensorReadingAt",
      header: "Last reading",
      cell: (asset) =>
        asset.lastSensorReadingAt
          ? format(new Date(asset.lastSensorReadingAt), "MM/dd/yyyy HH:mm")
          : "—",
    },
  ];

  if (onAssetClick) {
    columns.push({
      id: "chevron",
      header: "",
      headClassName: "w-8",
      cellClassName: "text-muted-foreground",
      cell: () => <ChevronRight className="size-4" />,
    });
  }

  return (
    <div className="space-y-2">
      <DataTable
        data={data}
        columns={columns}
        rowKey={(asset) => asset.id}
        showIndex
        pageNumber={pageNumber}
        pageSize={pageSize}
        onRowClick={onAssetClick}
      />

      {totalPages > 1 && (
        <DataPagination
          totalItems={totalCount}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          hasNextPage={pageNumber < totalPages}
          hasPreviousPage={pageNumber > 1}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
