import { ScrollText, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BatteryAuditLogDto } from "@/features/admin/types/battery-audit.types";

// severity → màu badge (display-only; KHÔNG phải filter).
const SEVERITY_STYLE: Record<string, string> = {
  Info: "bg-blue-50 text-blue-700 border-blue-200",
  Warning: "bg-amber-50 text-amber-700 border-amber-200",
  Critical: "bg-red-50 text-red-600 border-red-200",
  Security: "bg-orange-50 text-orange-700 border-orange-200",
};

interface BatteryAuditLogTableProps {
  logs: BatteryAuditLogDto[];
  isLoading: boolean;
  pageNumber: number;
  pageSize: number;
}

export default function BatteryAuditLogTable({
  logs,
  isLoading,
  pageNumber,
  pageSize,
}: BatteryAuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <ScrollText size={32} className="opacity-30" />
        <span className="text-sm">Không có audit log nào.</span>
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="w-12 text-center">STT</TableHead>
          <TableHead className="w-44">Thời gian</TableHead>
          <TableHead>Hành động</TableHead>
          <TableHead className="w-28">Mức độ</TableHead>
          <TableHead>Đối tượng</TableHead>
          <TableHead className="w-40">Thực hiện</TableHead>
          <TableHead className="w-24 text-center">Kết quả</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log, index) => (
          <TableRow
            key={log.id}
            className="hover:bg-muted/50 transition-colors"
          >
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
              {format(new Date(log.occurredAt), "dd/MM/yyyy HH:mm:ss", {
                locale: vi,
              })}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{log.actionCode}</span>
                <span className="text-[11px] text-muted-foreground">
                  {log.actionCategory}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`text-[10.5px] ${
                  SEVERITY_STYLE[log.severity] ??
                  "bg-muted text-muted-foreground border-border"
                }`}
              >
                {log.severity}
              </Badge>
            </TableCell>
            <TableCell className="text-sm truncate">
              {log.targetDisplay ?? log.targetId ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-xs font-mono text-muted-foreground truncate">
              {log.actorAccountId ?? "Hệ thống"}
            </TableCell>
            <TableCell className="text-center">
              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full border ${
                  log.isSuccess
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200"
                }`}
              >
                {log.isSuccess ? (
                  <CheckCircle2 size={10} />
                ) : (
                  <XCircle size={10} />
                )}
                {log.isSuccess ? "OK" : "FAIL"}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
