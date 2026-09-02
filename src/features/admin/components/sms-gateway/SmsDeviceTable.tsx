import { Ban } from "lucide-react";
import { formatDateTime } from "@/shared/utils/datetime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toneClass } from "@/shared/theme/statusColors";
import type { GatewayDeviceDto } from "@/features/admin/types/ticket/sms-gateway.types";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes — per BE controller remark

const isOnline = (lastSeenAt: string | null) =>
  !!lastSeenAt &&
  Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

const fmt = (dt: string | null) => (dt ? formatDateTime(dt) : "—");

interface SmsDeviceTableProps {
  data: GatewayDeviceDto[];
  onRevoke: (device: GatewayDeviceDto) => void;
}

function StatusBadge({ device }: { device: GatewayDeviceDto }) {
  if (!device.isActive) {
    return (
      <Badge variant="outline" className={toneClass("p1")}>
        Revoked
      </Badge>
    );
  }
  return isOnline(device.lastSeenAt) ? (
    <Badge variant="outline" className={toneClass("ok")}>
      Online
    </Badge>
  ) : (
    <Badge variant="outline" className={toneClass("muted")}>
      Offline
    </Badge>
  );
}

function statusSortValue(d: GatewayDeviceDto): string {
  if (!d.isActive) return "0-revoked";
  return isOnline(d.lastSeenAt) ? "1-online" : "2-offline";
}

export default function SmsDeviceTable({
  data,
  onRevoke,
}: SmsDeviceTableProps) {
  const columns: ColumnDef<GatewayDeviceDto>[] = [
    {
      id: "deviceName",
      header: "Device",
      sortKey: "deviceName",
      sortValue: (d) => d.deviceName,
      cell: (d) => (
        <>
          <div className="font-medium">{d.deviceName}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {d.deviceCode}
          </div>
        </>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      sortValue: (d) => statusSortValue(d),
      cell: (d) => (
        <>
          <StatusBadge device={d} />
          {!d.isActive && d.revokedAt && (
            <div className="text-xs text-muted-foreground mt-1">
              Revoked at {fmt(d.revokedAt)}
            </div>
          )}
        </>
      ),
    },
    {
      id: "sentToday",
      header: "Today",
      sortKey: "sentToday",
      sortValue: (d) => d.sentToday,
      cellClassName: "tabular-nums",
      cell: (d) => `${d.sentToday}/${d.dailyLimit}`,
    },
    {
      id: "lastSeenAt",
      header: "Last active",
      sortKey: "lastSeenAt",
      sortValue: (d) =>
        d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : null,
      cell: (d) => (
        <>
          <div>{fmt(d.lastSeenAt)}</div>
          {d.lastSeenIp && (
            <div className="text-xs text-muted-foreground font-mono">
              {d.lastSeenIp}
            </div>
          )}
        </>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      sortValue: (d) => (d.createdAt ? new Date(d.createdAt).getTime() : null),
      cellClassName: "text-muted-foreground",
      cell: (d) => fmt(d.createdAt),
    },
    {
      id: "actions",
      header: TABLE_COLUMNS.actions,
      headClassName: "text-right",
      cellClassName: "text-right",
      stopRowClick: true,
      cell: (d) => (
        <Button
          variant="destructive"
          size="sm"
          disabled={!d.isActive}
          onClick={() => onRevoke(d)}
        >
          <Ban className="size-3.5" /> Revoke
        </Button>
      ),
    },
  ];

  return (
    <DataTable data={data} columns={columns} rowKey={(d) => d.id} showIndex />
  );
}
