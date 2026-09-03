import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import {
  useAlertList,
  useAlertDetail,
  useResolveAlert,
} from "@/shared/hooks/alerts/useAlerts";
import { alertService } from "@/shared/services/alerts/alert.service";
import { useTicketCode } from "@/shared/hooks/ticket/useTicketCode";
import type { SiteOption } from "@/shared/types/site/site.types";
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
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import AlertSeverityBadge from "./AlertSeverityBadge";
import AlertStatusBadge from "./AlertStatusBadge";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { noData, notFound } from "@/shared/constants/emptyStates";
import { formatDateTime } from "@/shared/utils/datetime";
import { shortId } from "@/shared/utils/displayId";

const DEFAULTS = {
  severity: "",
  status: "",
  from: "",
  to: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
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

// Measured value can be null from the BE (thresholdValue/actualValue/unit are nullable)
const formatMeasure = (value?: number | null, unit?: string | null) => {
  if (unit?.toLowerCase() === "wet" || unit?.toLowerCase() === "bool")
    return "Wet";
  return value == null ? "—" : `${value}${unit ? ` ${unit}` : ""}`;
};

export default function AlertsView({
  subtitle,
  basePath,
  sites,
}: {
  subtitle: string;
  // Role prefix ("/admin" | "/manager" | "/staff") for the link to the linked ticket.
  // Passed in rather than derived from the session because each portal mounts its own
  // `tickets/:id` route — following the same convention as BlogEditorView.
  basePath: string;
  // Used to name site-level alerts. Passed in rather than fetched here because each
  // portal has its own useSiteList hook and shared/ must not import from features/ —
  // same arrangement as EnvironmentalIncidentsView.
  sites?: SiteOption[];
}) {
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
    from: filters.from || undefined,
    // `to` is date-only from the input → send end-of-day so the selected day is fully
    // covered (avoids excluding alerts that fall on the `to` day itself). Same as
    // EnvironmentalIncidentsView.
    to: filters.to ? `${filters.to}T23:59:59` : undefined,
    // Environmental incidents have their own screen; the mirror alert the BE writes for
    // each one would otherwise show up here as a serial-less "0 incident / 0 incident" row.
    excludeEnvironmentalIncidents: true,
    // Device-level alerts (connection lost, data-integrity violation) belong to the gateway,
    // not to any one battery, so they carry no serial. They have their own screen now — see
    // DeviceAlertsView. Excluding them here is what makes the two lists disjoint and clears
    // the serial-less rows out of this table.
    excludeIotDeviceAlerts: true,
  });
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {subtitle}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Battery alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} alerts &mdash; anomalies detected
            by the system
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
              // Info hidden per request — logic kept intact, not removed.
              <SelectItem
                key={s}
                value={String(s)}
                className={s === AlertSeverityEnum.Info ? "hidden" : undefined}
              >
                {SEVERITY_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter hidden per request — logic kept intact, not removed. */}
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
          <SelectTrigger className="w-44 hidden">
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

        <DatePicker
          className="w-40"
          value={filters.from}
          onChange={(v) => setFilter("from", v)}
          max={filters.to}
        />
        <DatePicker
          className="w-40"
          value={filters.to}
          onChange={(v) => setFilter("to", v)}
          min={filters.from}
        />

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
            <span className="text-sm">
              {hasActiveFilter ? notFound("alerts") : noData("alerts")}
            </span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Battery serial</TableHead>
                <TableHead>{TABLE_COLUMNS.customer}</TableHead>
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
                  {/* Empty when the BE cannot resolve the account (deleted or not yet
                      synced) — show a dash rather than a blank cell. */}
                  <TableCell>{alert.customerName || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {anomalyLabel(alert.anomalyType)}
                    </Badge>
                  </TableCell>
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
        basePath={basePath}
        sites={sites}
        onClose={() => setSelectedId(null)}
      />
    </PageContainer>
  );
}

// ── Detail dialog ────────────────────────────────────────────────────────
function AlertDetailDialog({
  alertId,
  basePath,
  sites,
  onClose,
}: {
  alertId: string | null;
  basePath: string;
  sites?: SiteOption[];
  onClose: () => void;
}) {
  const { data: alert, isLoading } = useAlertDetail(alertId ?? "");
  const {
    code: ticketCode,
    status: ticketStatus,
    isLoading: ticketCodeLoading,
  } = useTicketCode(alert?.ticketId);

  // An Open ticket has not been assigned yet — for the Manager it sits in the Queue, which
  // is its own route (/manager/tickets/queue/:id). Anything past Open is an assigned ticket
  // and belongs under /tickets/:id. Admin/Staff have no queue route, so they always use
  // /tickets/:id. Falls back to /tickets/:id until the ticket lookup settles.
  const ticketHref =
    alert?.ticketId == null
      ? null
      : basePath === "/manager" && ticketStatus === TicketStatusEnum.Open
        ? `${basePath}/tickets/queue/${alert.ticketId}`
        : `${basePath}/tickets/${alert.ticketId}`;

  // Falls back to a shortened id when the site list has not loaded or the site is
  // outside this user's scope — matches EnvironmentalIncidentsView.
  const siteNameById = new Map((sites ?? []).map((s) => [s.id, s.name]));
  const siteName = (id?: string | null) =>
    id ? (siteNameById.get(id) ?? id.slice(0, 8)) : null;
  const { mutate: resolve, isPending: resolvePending } = useResolveAlert();

  const canResolve =
    alert?.status === AlertStatusEnum.Open ||
    alert?.status === AlertStatusEnum.Acknowledged;

  // Opening the dialog on an Open alert acknowledges it right away, so the reviewer
  // doesn't have to click a separate button before they can act on it. Calls the
  // service directly (skipping useAcknowledgeAlert) so this silent step doesn't
  // surface a toast — one alert per id.
  const qc = useQueryClient();
  const autoAckedId = useRef<string | null>(null);
  useEffect(() => {
    if (
      alert &&
      alert.status === AlertStatusEnum.Open &&
      autoAckedId.current !== alert.id
    ) {
      autoAckedId.current = alert.id;
      alertService
        .acknowledge(alert.id)
        .then(() => qc.invalidateQueries({ queryKey: [KEY.alerts] }));
    }
  }, [alert, qc]);

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
          {alert ? (
            <DialogDescription>
              {alertSubject(alert)} · {anomalyLabel(alert.anomalyType)}
            </DialogDescription>
          ) : (
            <Skeleton className="h-4 w-40 mt-0.5" />
          )}
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
            <DetailRow label="Customer">{alert.customerName || "—"}</DetailRow>
            <DetailRow label={isSiteLevel(alert) ? "Site" : "Battery"}>
              <span className="font-mono text-xs">
                {/* BE đã trả sẵn siteName trong alert — dùng thẳng, đáng tin cậy hơn tra qua
                    danh sách `sites` prop (có thể chưa load hết hoặc lệch trang, rơi xuống
                    UUID rút gọn). The battery branch beside it has always shown a serial, so
                    leaving the site branch as a raw UUID read as a defect. */}
                {isSiteLevel(alert)
                  ? alert.siteName || (siteName(alert.siteId) ?? "—")
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
              {alert.ticketId && ticketHref ? (
                ticketCodeLoading && !ticketCode ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <Link
                    to={ticketHref}
                    className="font-mono-num text-xs text-primary hover:underline"
                  >
                    {/* Two remaining states: the code once it lands, and a SHORTENED id only
                        when the lookup has settled without one (403 / deleted ticket). Never a
                        full GUID; the link itself still uses the full id. */}
                    {ticketCode ?? shortId(alert.ticketId)}
                  </Link>
                )
              ) : (
                "—"
              )}
            </DetailRow>
          </dl>
        )}

        <DialogFooter>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  disabled={!canResolve || resolvePending}
                  onClick={() => alert && resolve(alert.id)}
                />
              }
            >
              Mark resolved
            </TooltipTrigger>
            {!canResolve && (
              <TooltipContent>
                This alert is already resolved or dismissed
              </TooltipContent>
            )}
          </Tooltip>
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
