import { Ban } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GatewayDeviceDto } from "@/features/admin/types/sms-gateway.types";
import { SortableTableHead } from "@/shared/components/common/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 phút — theo controller remark BE

const isOnline = (lastSeenAt: string | null) =>
  !!lastSeenAt &&
  Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

const fmt = (dt: string | null) =>
  dt ? format(new Date(dt), "dd/MM/yyyy HH:mm") : "—";

interface SmsDeviceTableProps {
  data: GatewayDeviceDto[];
  onRevoke: (device: GatewayDeviceDto) => void;
}

function StatusBadge({ device }: { device: GatewayDeviceDto }) {
  if (!device.isActive) {
    return <Badge variant="destructive">Đã thu hồi</Badge>;
  }
  return isOnline(device.lastSeenAt) ? (
    <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
      Online
    </Badge>
  ) : (
    <Badge variant="secondary">Offline</Badge>
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
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData<GatewayDeviceDto>(data, (d, key) => {
      switch (key) {
        case "deviceName":
          return d.deviceName;
        case "status":
          return statusSortValue(d);
        case "sentToday":
          return d.sentToday;
        case "lastSeenAt":
          return d.lastSeenAt ? new Date(d.lastSeenAt) : null;
        case "createdAt":
          return d.createdAt ? new Date(d.createdAt) : null;
        default:
          return null;
      }
    });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">STT</TableHead>
          <SortableTableHead
            sortKey="deviceName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Thiết bị
          </SortableTableHead>
          <SortableTableHead
            sortKey="status"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Trạng thái
          </SortableTableHead>
          <SortableTableHead
            sortKey="sentToday"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Hôm nay
          </SortableTableHead>
          <SortableTableHead
            sortKey="lastSeenAt"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Hoạt động gần nhất
          </SortableTableHead>
          <SortableTableHead
            sortKey="createdAt"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Tạo lúc
          </SortableTableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((d, i) => (
          <TableRow key={d.id}>
            <TableCell className="text-center text-muted-foreground">
              {i + 1}
            </TableCell>
            <TableCell>
              <div className="font-medium">{d.deviceName}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {d.deviceCode}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge device={d} />
              {!d.isActive && d.revokedAt && (
                <div className="text-xs text-muted-foreground mt-1">
                  Thu hồi lúc {fmt(d.revokedAt)}
                </div>
              )}
            </TableCell>
            <TableCell className="tabular-nums">
              {d.sentToday}/{d.dailyLimit}
            </TableCell>
            <TableCell>
              <div>{fmt(d.lastSeenAt)}</div>
              {d.lastSeenIp && (
                <div className="text-xs text-muted-foreground font-mono">
                  {d.lastSeenIp}
                </div>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {fmt(d.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={!d.isActive}
                onClick={() => onRevoke(d)}
              >
                <Ban className="size-3.5" /> Thu hồi
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
