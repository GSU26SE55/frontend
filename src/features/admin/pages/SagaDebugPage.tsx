import { useState } from "react";
import { formatDateTime } from "@/shared/utils/datetime";
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
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

function fmt(d?: string | null) {
  return d ? formatDateTime(d) : "—";
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
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
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
        You do not have permission to view this page.
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4 py-6 pl-(--page-pl) pr-(--page-pr)">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Saga: Alert → Ticket</h1>
          <p className="text-sm text-muted-foreground">
            Monitor & reprocess the pipeline that auto-creates tickets from
            alerts.
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
            Failed sagas only
          </Button>
          <RefreshButton queryKeys={[KEY.admin.sagas]} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">
          Couldn't load the saga list.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No sagas.
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
                  <TableHead>Started</TableHead>
                  <TableHead>Failed at</TableHead>
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
                        {/* FailedAtStage reuses the state machine's state names (see MarkFailed). */}
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
                              View details
                            </DropdownMenuItem>
                            {failed && canReprocess && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={reprocessing}
                                  onClick={() => reprocess(s.alertId)}
                                >
                                  Reprocess
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
            <DialogTitle>Saga details</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-0.5">
              <DetailRow label="Correlation ID" value={detail.correlationId} />
              <DetailRow
                label="Status"
                value={sagaStateLabel(detail.currentState)}
              />
              <DetailRow label="Alert ID" value={detail.alertId} />
              <DetailRow
                label="Battery Asset"
                value={detail.assetSerialNumber ?? detail.batteryAssetId}
              />
              <DetailRow label="Customer ID" value={detail.customerId} />
              <DetailRow
                label="Anomaly type"
                value={anomalyTypeLabel(detail.anomalyType)}
              />
              <DetailRow
                label="Severity"
                value={alertSeverityLabel(detail.severity)}
              />
              <DetailRow
                label="Ticket"
                value={
                  detail.ticketCode
                    ? `${detail.ticketCode}${detail.ticketIsReused ? " (reused)" : ""}`
                    : "—"
                }
              />
              <DetailRow label="Retry" value={detail.retryCount} />
              <DetailRow
                label="Failed at stage"
                value={
                  detail.failedAtStage
                    ? sagaStateLabel(detail.failedAtStage)
                    : "—"
                }
              />
              <DetailRow label="Failure reason" value={detail.failureReason} />
              <DetailRow label="Error code" value={detail.failureErrorCode} />
              <DetailRow label="Failed at" value={fmt(detail.failedAt)} />
              <DetailRow label="Started" value={fmt(detail.startedAt)} />
              <DetailRow label="Completed" value={fmt(detail.completedAt)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
