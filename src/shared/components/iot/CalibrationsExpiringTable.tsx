import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import type { IotDeviceCalibrationDto } from "@/shared/types/iot/iot.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  items: IotDeviceCalibrationDto[];
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Manager view — flat list of calibrations about to expire (cross-device, sorted expiresAt ASC by the BE).
export default function CalibrationsExpiringTable({ items }: Props) {
  const columns: ColumnDef<IotDeviceCalibrationDto>[] = [
    {
      id: "iotDeviceId",
      header: "Device",
      // Falls back to the id when the device row is gone — an expiring calibration still
      // has to be visible.
      cell: (item) => item.iotDeviceCode ?? item.iotDeviceId,
      cellClassName: "font-mono text-xs",
    },
    {
      id: "channel",
      header: TABLE_COLUMNS.channel,
      cell: (item) => item.channel,
      cellClassName: "font-medium",
    },
    {
      id: "unit",
      header: TABLE_COLUMNS.unit,
      cell: (item) => item.unit,
    },
    {
      id: "calibratedAt",
      header: TABLE_COLUMNS.calibrated,
      cell: (item) => item.calibratedAt.slice(0, 10),
      cellClassName: "text-sm",
    },
    {
      id: "expiresAt",
      header: TABLE_COLUMNS.expiresAt,
      cell: (item) => (item.expiresAt ? item.expiresAt.slice(0, 10) : "—"),
      cellClassName: "text-sm",
    },
    {
      id: "daysRemaining",
      header: "Remaining",
      cell: (item) => {
        const days = item.expiresAt ? daysUntil(item.expiresAt) : null;
        return days !== null ? (
          <Badge variant={days <= 7 ? "destructive" : "secondary"}>
            {days} days
          </Badge>
        ) : null;
      },
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      rowKey={(item) => item.id}
      empty={<EmptyState title="No calibrations expiring soon" />}
    />
  );
}
