import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { checkPermission, P } from "@/shared/lib/authz";
import {
  useAlertTicketSagas,
  useReprocessSaga,
} from "@/features/admin/hooks/ticket/useAdminSagas";
import type { AlertTicketSagaDTO } from "@/features/admin/types/ticket/saga.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { sagaStateLabel } from "@/features/admin/enums/saga.enum";
import {
  alertSeverityLabel,
  anomalyTypeLabel,
} from "@/shared/constants/alertLabels";
import { toneClass, SAGA_STATE_TONE } from "@/shared/theme/statusColors";

function fmt(d?: string | null) {
  return d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right break-all">
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function SagaDebugPage() {
  const user = useSessionStore((s) => s.user);
  const canView = checkPermission(user, P.TICKET_SAGA_VIEW);
  const canReprocess = checkPermission(user, P.TICKET_SAGA_REPROCESS);

  const [onlyFailed, setOnlyFailed] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detail, setDetail] = useState<AlertTicketSagaDTO | null>(null);

  const { data, isLoading, isError } = useAlertTicketSagas({
    isFailed: onlyFailed || undefined,
    pageNumber,
    pageSize,
  });
  const { mutate: reprocess, isPending: reprocessing } = useReprocessSaga();

  if (!canView) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Bạn không có quyền xem trang này.
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Saga: Alert → Ticket</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi & xử lý lại pipeline tự tạo ticket từ cảnh báo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={onlyFailed ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setOnlyFailed((v) => !v);
              setPageNumber(1);
            }}
          >
            Chỉ saga lỗi
          </Button>
          <RefreshButton queryKeys={[KEY.admin.sagas]} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">
          Không tải được danh sách saga.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Không có saga nào.
        </p>
      ) : (
        <>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>{TABLE_COLUMNS.status}</TableHead>
                  <TableHead>{TABLE_COLUMNS.ticket}</TableHead>
                  <TableHead>Retry</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Lỗi tại</TableHead>
                  <TableHead className="text-right">
                    {TABLE_COLUMNS.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => {
                  const failed = !!s.failedAtStage || !!s.failedAt;
                  return (
                    <TableRow key={s.correlationId}>
                      <TableCell className="font-mono text-xs">
                        {s.alertId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={toneClass(
                            SAGA_STATE_TONE[s.currentState] ?? "muted",
                          )}
                        >
                          {sagaStateLabel(s.currentState)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.ticketCode ?? "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {s.retryCount}
                      </TableCell>
                      <TableCell className="text-xs">
                        {fmt(s.startedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {/* FailedAtStage dùng lại tên state của state machine (xem MarkFailed). */}
                        {s.failedAtStage
                          ? sagaStateLabel(s.failedAtStage)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                              />
                            }
                          >
                            <EllipsisVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => setDetail(s)}>
                              Xem chi tiết
                            </DropdownMenuItem>
                            {failed && canReprocess && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={reprocessing}
                                  onClick={() => reprocess(s.alertId)}
                                >
                                  Xử lý lại
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {data && (
            <DataPagination
              totalItems={data.totalItems}
              pageNumber={data.pageNumber}
              pageSize={data.pageSize}
              totalPages={data.totalPages}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={setPageNumber}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPageNumber(1);
              }}
            />
          )}
        </>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết saga</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-0.5">
              <DetailRow label="Correlation ID" value={detail.correlationId} />
              <DetailRow
                label="Trạng thái"
                value={sagaStateLabel(detail.currentState)}
              />
              <DetailRow label="Alert ID" value={detail.alertId} />
              <DetailRow
                label="Battery Asset"
                value={detail.assetSerialNumber ?? detail.batteryAssetId}
              />
              <DetailRow label="Customer ID" value={detail.customerId} />
              <DetailRow
                label="Loại bất thường"
                value={anomalyTypeLabel(detail.anomalyType)}
              />
              <DetailRow
                label="Mức độ"
                value={alertSeverityLabel(detail.severity)}
              />
              <DetailRow
                label="Ticket"
                value={
                  detail.ticketCode
                    ? `${detail.ticketCode}${detail.ticketIsReused ? " (tái dùng)" : ""}`
                    : "—"
                }
              />
              <DetailRow label="Retry" value={detail.retryCount} />
              <DetailRow
                label="Lỗi tại stage"
                value={
                  detail.failedAtStage
                    ? sagaStateLabel(detail.failedAtStage)
                    : "—"
                }
              />
              <DetailRow label="Lý do lỗi" value={detail.failureReason} />
              <DetailRow label="Mã lỗi" value={detail.failureErrorCode} />
              <DetailRow label="Thời điểm lỗi" value={fmt(detail.failedAt)} />
              <DetailRow label="Bắt đầu" value={fmt(detail.startedAt)} />
              <DetailRow label="Hoàn thành" value={fmt(detail.completedAt)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
