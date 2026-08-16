import { useState } from "react";
import { BellRing } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import {
  useAlertList,
  useAlertDetail,
  useAcknowledgeAlert,
  useResolveAlert,
} from "@/shared/hooks/alerts/useAlerts";
import {
  AlertSeverityEnum,
  AlertStatusEnum,
} from "@/shared/enums/alerts/alert.enum";
import {
  ALERT_SEVERITY_LABELS as SEVERITY_LABELS,
  ALERT_STATUS_LABELS as STATUS_LABELS,
  anomalyTypeLabel,
} from "@/shared/constants/alertLabels";
import type { AlertDto } from "@/shared/types/alerts/alert.types";
import AlertSeverityBadge from "./AlertSeverityBadge";
import AlertStatusBadge from "./AlertStatusBadge";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

const DEFAULTS = {
  severity: "",
  status: "",
  pageNumber: 1,
  pageSize: 10,
};

const SEVERITY_OPTIONS = [
  AlertSeverityEnum.Info,
  AlertSeverityEnum.Warning,
  AlertSeverityEnum.Critical,
];

const STATUS_OPTIONS = [
  AlertStatusEnum.Open,
  AlertStatusEnum.Acknowledged,
  AlertStatusEnum.Resolved,
  AlertStatusEnum.Merged,
];

const anomalyLabel = anomalyTypeLabel;

// Site-level alerts (ambient / environmental incident) have batteryAssetId = "" (empty
// string, NOT null) with a non-null siteId → no battery serial to show. Use `=== ""` rather
// than a falsy check: "" and null mean different things in this contract.
const isSiteLevel = (alert: AlertDto) => alert.batteryAssetId === "";

const alertSubject = (alert: AlertDto) =>
  isSiteLevel(alert) ? "Site level" : alert.batterySerialNumber;

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "—";

// Measured value can be null from the BE (thresholdValue/actualValue/unit are nullable)
const formatMeasure = (value?: number | null, unit?: string | null) =>
  value == null ? "—" : `${value}${unit ? ` ${unit}` : ""}`;

export default function AlertsView({ subtitle }: { subtitle: string }) {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useAlertList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    severity: filters.severity
      ? (Number(filters.severity) as AlertSeverityEnum)
      : undefined,
    status: filters.status
      ? (Number(filters.status) as AlertStatusEnum)
      : undefined,
  });
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {subtitle}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Battery alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} alerts &mdash; anomalies detected by
            the system
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.alerts]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filters.severity || null}
          items={SEVERITY_OPTIONS.map((s) => ({
            value: String(s),
            label: SEVERITY_LABELS[s],
          }))}
          onValueChange={(v: string | null) =>
            setFilter("severity", v || undefined)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All severities</SelectItem>
            {SEVERITY_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {SEVERITY_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || null}
          items={STATUS_OPTIONS.map((s) => ({
            value: String(s),
            label: STATUS_LABELS[s],
          }))}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {STATUS_LABELS[s]}
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
            <BellRing className="size-8 opacity-30" />
            <span className="text-sm">No alerts yet.</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Battery serial</TableHead>
                <TableHead>Anomaly type</TableHead>
                <TableHead>{TABLE_COLUMNS.severity}</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>{TABLE_COLUMNS.detectedAt}</TableHead>
                <TableHead>{TABLE_COLUMNS.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((alert, index) => (
                <TableRow
                  key={alert.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(alert.id)}
                >
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {alertSubject(alert)}
                  </TableCell>
                  <TableCell>{anomalyLabel(alert.anomalyType)}</TableCell>
                  <TableCell>
                    <AlertSeverityBadge severity={alert.severity} />
                  </TableCell>
                  <TableCell className="font-mono-num text-sm">
                    {formatMeasure(alert.actualValue, alert.unit)} /{" "}
                    {formatMeasure(alert.thresholdValue, alert.unit)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(alert.detectedAt)}
                  </TableCell>
                  <TableCell>
                    <AlertStatusBadge status={alert.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      <AlertDetailDialog
        alertId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

// ── Detail dialog ────────────────────────────────────────────────────────
function AlertDetailDialog({
  alertId,
  onClose,
}: {
  alertId: string | null;
  onClose: () => void;
}) {
  const { data: alert, isLoading } = useAlertDetail(alertId ?? "");
  const { mutate: acknowledge, isPending: ackPending } = useAcknowledgeAlert();
  const { mutate: resolve, isPending: resolvePending } = useResolveAlert();

  const canAck = alert?.status === AlertStatusEnum.Open;
  const canResolve =
    alert?.status === AlertStatusEnum.Open ||
    alert?.status === AlertStatusEnum.Acknowledged;

  return (
    <Dialog
      open={!!alertId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alert details</DialogTitle>
          <DialogDescription>
            {alert
              ? `${alertSubject(alert)} · ${anomalyLabel(alert.anomalyType)}`
              : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !alert ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm py-2">
            <DetailRow label="Severity">
              <AlertSeverityBadge severity={alert.severity} />
            </DetailRow>
            <DetailRow label="Status">
              <AlertStatusBadge status={alert.status} />
            </DetailRow>
            <DetailRow label="Actual value">
              <span className="font-mono-num">
                {formatMeasure(alert.actualValue, alert.unit)}
              </span>
            </DetailRow>
            <DetailRow label="Threshold">
              <span className="font-mono-num">
                {formatMeasure(alert.thresholdValue, alert.unit)}
              </span>
            </DetailRow>
            <DetailRow label={isSiteLevel(alert) ? "Site" : "Battery"}>
              <span className="font-mono text-xs">
                {isSiteLevel(alert)
                  ? (alert.siteId ?? "—")
                  : alert.batterySerialNumber}
              </span>
            </DetailRow>
            <DetailRow label="Detected at">
              {formatDateTime(alert.detectedAt)}
            </DetailRow>
            <DetailRow label="Acknowledged at">
              {formatDateTime(alert.acknowledgedAt)}
            </DetailRow>
            <DetailRow label="Resolved at">
              {formatDateTime(alert.resolvedAt)}
            </DetailRow>
            <DetailRow label="Ticket">
              {alert.ticketId ? (
                <span className="font-mono-num text-xs">{alert.ticketId}</span>
              ) : (
                "—"
              )}
            </DetailRow>
          </dl>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={!canAck || ackPending}
            onClick={() => alert && acknowledge(alert.id)}
          >
            Acknowledge
          </Button>
          <Button
            disabled={!canResolve || resolvePending}
            onClick={() => alert && resolve(alert.id)}
          >
            Mark resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="col-span-1 text-muted-foreground">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </>
  );
}
