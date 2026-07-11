import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { IotDeviceCalibrationDto } from "@/shared/types/iot.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  items: IotDeviceCalibrationDto[];
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Manager view — flat list calibration sắp hết hạn (cross-device, sort expiresAt ASC từ BE).
export default function CalibrationsExpiringTable({ items }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device ID</TableHead>
          <TableHead>{TABLE_COLUMNS.channel}</TableHead>
          <TableHead>{TABLE_COLUMNS.unit}</TableHead>
          <TableHead>{TABLE_COLUMNS.calibrated}</TableHead>
          <TableHead>{TABLE_COLUMNS.expiresAt}</TableHead>
          <TableHead>Còn lại</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const days = item.expiresAt ? daysUntil(item.expiresAt) : null;
          return (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">
                {item.iotDeviceId}
              </TableCell>
              <TableCell className="font-medium">{item.channel}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-sm">
                {item.calibratedAt.slice(0, 10)}
              </TableCell>
              <TableCell className="text-sm">
                {item.expiresAt ? item.expiresAt.slice(0, 10) : "—"}
              </TableCell>
              <TableCell>
                {days !== null && (
                  <Badge variant={days <= 7 ? "destructive" : "secondary"}>
                    {days} ngày
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
        {items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-muted-foreground py-8"
            >
              Không có calibration sắp hết hạn
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
