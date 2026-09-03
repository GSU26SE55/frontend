import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/shared/components/ui/DatePicker";
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
import { KEY } from "@/shared/utils/queryKeys";
import AlertSeverityBadge from "@/shared/components/alerts/AlertSeverityBadge";
import AlertStatusBadge from "@/shared/components/alerts/AlertStatusBadge";
import {
  useAlertList,
  useAlertDetail,
  useResolveAlert,
} from "@/shared/hooks/alerts/useAlerts";
import { alertService } from "@/shared/services/alerts/alert.service";
import {
  ALERT_SEVERITY_LABELS as SEVERITY_LABELS,
  anomalyTypeLabel,
} from "@/shared/constants/alertLabels";
import {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { handleErrorApi } from "@/shared/lib/errors";
import { useSessionStore } from "@/shared/stores/sessionStore";
import {
  useIncidentTicket,
  useTicketCode,
} from "@/shared/hooks/ticket/useTicketCode";
import { checkRole } from "@/shared/lib/authz";
import { UserRole } from "@/shared/types/account/session.types";
import {
  useIncidentDetail,
  useResolveIncident,
  useFalseAlarmIncident,
} from "@/shared/hooks/alerts/useEnvironmentalIncidents";
import { environmentalService } from "@/shared/services/alerts/environmental.service";
import { EnvironmentalIncidentStatusEnum } from "@/shared/enums/alerts/environmental.enum";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import {
  resolveIncidentSchema,
  type ResolveIncidentFormValues,
} from "@/shared/schemas/alerts/environmental.schema";
import {
  falseAlarmSchema,
  type FalseAlarmFormValues,
} from "@/shared/schemas/alerts/environmental.schema";
import type { SiteOption } from "@/shared/types/site/site.types";
import ManualIncidentDialog from "./ManualIncidentDialog";
import IncidentStatusBadge from "./IncidentStatusBadge";
import IncidentTypeBadge from "./IncidentTypeBadge";
import {
  incidentTypeLabel,
  INCIDENT_TYPE_LABELS,
} from "@/shared/constants/incidentLabels";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { noData, notFound } from "@/shared/constants/emptyStates";
import { formatDateTime } from "@/shared/utils/datetime";

const DEFAULTS = {
  status: "",
  severity: "",
  siteId: "",
  from: "",
  to: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

// Statuses of the ALERT table, which is what this screen now reads. Merged is left out on
// purpose: the BE drops those by default (`excludeMerged`), they are echoes of an alert already
// listed here.
const STATUS_OPTIONS = [
  AlertStatusEnum.Open,
  AlertStatusEnum.Acknowledged,
  AlertStatusEnum.Resolved,
];
const STATUS_LABELS: Record<number, string> = {
  [AlertStatusEnum.Open]: "Open",
  [AlertStatusEnum.Acknowledged]: "Acknowledged",
  [AlertStatusEnum.Resolved]: "Resolved",
};

const SEVERITY_OPTIONS = [
  AlertSeverityEnum.Info,
  AlertSeverityEnum.Warning,
  AlertSeverityEnum.Critical,
];

export default function EnvironmentalIncidentsView({
  subtitle,
  sites,
}: {
  subtitle: string;
  sites?: SiteOption[];
}) {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  // Chi tiết sống trong URL, không chỉ trong state: notification về một sự cố deep-link tới
  // `environmental-incidents?incident=<id>` (trang này là danh sách, không có route /:id), nên
  // dialog phải mở được từ chính URL đó.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("incident");
  const setSelectedId = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("incident", id);
    else next.delete("incident");
    setSearchParams(next, { replace: true });
  };
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const user = useSessionStore((s) => s.user);
  const ticketBasePath = user?.role === UserRole.ADMIN ? "/admin" : "/manager";

  const siteNameById = new Map((sites ?? []).map((s) => [s.id, s.name]));
  const siteName = (id: string) => siteNameById.get(id) ?? id.slice(0, 8);

  // ONE source for the whole screen. Every EnvironmentalIncident also writes a row into the alert
  // table, so `siteLevelOnly` already returns both halves of "environmental": incidents reported by
  // the firmware and thresholds breached against the site's config. Reading the two endpoints
  // instead would mean paginating two independent result sets into one table, which cannot be done
  // correctly without pulling everything client-side.
  const { data, isLoading } = useAlertList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    siteLevelOnly: true,
    siteId: filters.siteId || undefined,
    status: filters.status
      ? (Number(filters.status) as AlertStatusEnum)
      : undefined,
    severity: filters.severity
      ? (Number(filters.severity) as AlertSeverityEnum)
      : undefined,
    from: filters.from || undefined,
    // `to` is date-only from the input → send end-of-day so the selected day is fully covered
    // (avoids excluding rows that fall on the `to` day itself).
    to: filters.to ? `${filters.to}T23:59:59` : undefined,
  });
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Environmental incidents
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Environmental alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Need the site list to pick a SiteId (required field) → hide the button until it's available.
              Staff can only list sites once BE opens GET /api/sites to the Staff role. */}
          {/* Manual report button hidden per request — logic kept intact, not removed. */}
          {sites && sites.length > 0 && (
            <Button
              size="sm"
              className="hidden"
              onClick={() => setReportOpen(true)}
            >
              Manual report
            </Button>
          )}
          <RefreshButton queryKeys={[KEY.alerts]} />
        </div>
      </div>

      {sites && sites.length > 0 && (
        <ManualIncidentDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          sites={sites}
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
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
          <SelectTrigger className="w-40">
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

        {/* No "type" filter: the list now mixes incidents (Gas leak, Flood…) with threshold
            breaches (High gas concentration…), which are two different enums on the BE. A dropdown
            of incident types would silently hide every threshold row, so status / site / date —
            the three that apply to both — are the filters kept. */}

        {sites && sites.length > 0 && (
          <Select
            value={filters.siteId || null}
            items={sites.map((s) => ({ value: s.id, label: s.name }))}
            onValueChange={(v: string | null) =>
              setFilter("siteId", v || undefined)
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={null}>All sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
            <ShieldAlert className="size-8 opacity-30" />
            <span className="text-sm">
              {hasActiveFilter
                ? notFound("environmental alerts")
                : noData("environmental alerts")}
            </span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Site</TableHead>
                <TableHead>{TABLE_COLUMNS.customer}</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{TABLE_COLUMNS.severity}</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>{TABLE_COLUMNS.detectedAt}</TableHead>
                <TableHead>{TABLE_COLUMNS.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((alert, index) => {
                // Only rows matching EnvironmentalIncidentTypeEnum (Smoke, Fire, Gas leak, Flood, OverheatHazard, Other)
                // have an environmental incident behind them with a detail dialog to open.
                // Threshold breaches (sensor ambient alerts) do not have incident details, so they are not clickable.
                const isIncident =
                  alert.environmentalIncidentId != null &&
                  alert.incidentType != null &&
                  alert.incidentType in INCIDENT_TYPE_LABELS;
                const incidentId = isIncident
                  ? alert.environmentalIncidentId
                  : null;

                return (
                  <TableRow
                    key={alert.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (isIncident && incidentId) {
                        setSelectedId(incidentId);
                      } else {
                        setSelectedAlertId(alert.id);
                      }
                    }}
                  >
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {alert.siteId ? siteName(alert.siteId) : "—"}
                    </TableCell>
                    {/* Empty when the BE cannot resolve the account — show a dash. */}
                    <TableCell>{alert.customerName || "—"}</TableCell>
                    <TableCell>
                      {isIncident ? (
                        <IncidentTypeBadge incidentType={alert.incidentType!} />
                      ) : (
                        <Badge variant="outline">
                          {anomalyTypeLabel(alert.anomalyType)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertSeverityBadge severity={alert.severity} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {alert.anomalyType === AnomalyTypeEnum.WaterLeak ||
                      alert.unit?.toLowerCase() === "wet" ||
                      alert.unit?.toLowerCase() === "bool"
                        ? "Wet"
                        : alert.actualValue == null || isIncident
                          ? "—"
                          : `${alert.actualValue}${alert.unit ? ` ${alert.unit}` : ""} / ${alert.thresholdValue ?? "—"}${alert.unit ? ` ${alert.unit}` : ""}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(alert.detectedAt)}
                    </TableCell>
                    <TableCell>
                      <AlertStatusBadge status={alert.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <IncidentDetailDialog
        incidentId={selectedId}
        siteName={siteName}
        onClose={() => setSelectedId(null)}
      />

      <AmbientAlertDetailDialog
        alertId={selectedAlertId}
        basePath={ticketBasePath}
        siteName={(id) => (id ? siteName(id) : null)}
        onClose={() => setSelectedAlertId(null)}
      />
    </PageContainer>
  );
}

// ── Detail dialog ────────────────────────────────────────────────────────────
function IncidentDetailDialog({
  incidentId,
  siteName,
  onClose,
}: {
  incidentId: string | null;
  siteName: (id: string) => string;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const canFalseAlarm = checkRole(user, UserRole.ADMIN, UserRole.MANAGER);

  const { data: incident, isLoading } = useIncidentDetail(incidentId ?? "");
  // Ticket sinh ra từ sự cố này. Alert của pin mang sẵn ticketId trong payload nên dialog bên đó
  // link thẳng được; sự cố môi trường thì không — quan hệ chỉ nằm phía ticket, nên phải tra ngược.
  const { ticket: incidentTicket, isLoading: ticketLoading } =
    useIncidentTicket(incidentId);
  // Staff không có trang này (route chỉ mở cho Admin/Manager), nên chỉ cần 2 prefix.
  const ticketBasePath = user?.role === UserRole.ADMIN ? "/admin" : "/manager";
  // Ticket vừa tạo (Open) chưa được triage/assign — với Manager nó nằm ở Queue
  // (/manager/tickets/queue/:id), không phải danh sách ticket thường. Cùng quy tắc với
  // dialog alert của pin (AlertsView.tsx) — hai nơi phải đồng nhất, nếu không Manager bấm
  // vào ticket Open từ đây sẽ vào nhầm trang, "Back" đưa về sai chỗ.
  const ticketHref = incidentTicket
    ? ticketBasePath === "/manager" &&
      incidentTicket.status === TicketStatusEnum.Open
      ? `${ticketBasePath}/tickets/queue/${incidentTicket.id}`
      : `${ticketBasePath}/tickets/${incidentTicket.id}`
    : null;

  const [panel, setPanel] = useState<"none" | "resolve" | "falseAlarm">("none");

  const status = incident?.status;
  const canResolve =
    status === EnvironmentalIncidentStatusEnum.Open ||
    status === EnvironmentalIncidentStatusEnum.Acknowledged;
  const canMarkFalseAlarm =
    canFalseAlarm &&
    (status === EnvironmentalIncidentStatusEnum.Open ||
      status === EnvironmentalIncidentStatusEnum.Acknowledged);

  // Opening the dialog on an Open incident acknowledges it right away, so the reviewer
  // doesn't have to click a separate button before they can act on it. Calls the service
  // directly (skipping useAcknowledgeIncident) so this silent step doesn't surface a toast.
  const qc = useQueryClient();
  const autoAckedId = useRef<string | null>(null);
  useEffect(() => {
    if (
      incident &&
      incident.status === EnvironmentalIncidentStatusEnum.Open &&
      autoAckedId.current !== incident.id
    ) {
      autoAckedId.current = incident.id;
      environmentalService.acknowledge(incident.id).then(() => {
        qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
        // The table on this screen reads from the alert mirror row (useAlertList), a
        // separate cache — without this it keeps showing "Open" after the silent ack.
        qc.invalidateQueries({ queryKey: [KEY.alerts] });
      });
    }
  }, [incident, qc]);

  return (
    <Dialog
      open={!!incidentId}
      onOpenChange={(open) => {
        if (!open) {
          setPanel("none");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Incident details</DialogTitle>
          <DialogDescription>
            {incident
              ? `${siteName(incident.siteId)} · ${incidentTypeLabel(incident.incidentType)}`
              : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !incident ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm py-2">
            <DetailRow label="Customer">
              {incident.customerName || "—"}
            </DetailRow>
            <DetailRow label="Type">
              <IncidentTypeBadge incidentType={incident.incidentType} />
            </DetailRow>
            <DetailRow label="Severity">
              <AlertSeverityBadge severity={incident.severity} />
            </DetailRow>
            <DetailRow label="Status">
              <IncidentStatusBadge status={incident.status} />
            </DetailRow>
            <DetailRow label="Reported by">
              {incident.reportedBy ?? "—"}
            </DetailRow>
            <DetailRow label="Detected at">
              {formatDateTime(incident.detectedAt)}
            </DetailRow>
            <DetailRow label="Acknowledged at">
              {formatDateTime(incident.acknowledgedAt)}
            </DetailRow>
            <DetailRow label="Resolved at">
              {formatDateTime(incident.resolvedAt)}
            </DetailRow>
            <DetailRow label="Ticket">
              {/* Ba trạng thái tách bạch, cùng quy ước với dialog alert của pin: mã ticket khi
                  có, dấu chờ khi đang tra, và "—" khi sự cố chưa sinh ra ticket nào (consumer
                  có thể chưa chạy xong) — không phải lỗi. */}
              {incidentTicket && ticketHref ? (
                <Link
                  to={ticketHref}
                  className="font-mono-num text-xs text-primary hover:underline"
                >
                  {incidentTicket.code}
                </Link>
              ) : ticketLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                "—"
              )}
            </DetailRow>
            {incident.resolutionNote && (
              <DetailRow label="Resolution note">
                {incident.resolutionNote}
              </DetailRow>
            )}
            {incident.falseAlarmReason && (
              <DetailRow label="False alarm reason">
                {incident.falseAlarmReason}
              </DetailRow>
            )}
          </dl>
        )}

        {incident && panel === "resolve" && (
          <ResolveForm
            incidentId={incident.id}
            onDone={() => setPanel("none")}
          />
        )}
        {incident && panel === "falseAlarm" && (
          <FalseAlarmForm
            incidentId={incident.id}
            onDone={() => setPanel("none")}
          />
        )}

        {incident && panel === "none" && (
          <DialogFooter className="flex-wrap">
            {canMarkFalseAlarm && (
              <Button variant="outline" onClick={() => setPanel("falseAlarm")}>
                False alarm
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    disabled={!canResolve}
                    onClick={() => setPanel("resolve")}
                  />
                }
              >
                Resolve
              </TooltipTrigger>
              {!canResolve && (
                <TooltipContent>
                  This incident is already resolved or a false alarm
                </TooltipContent>
              )}
            </Tooltip>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Resolve form ─────────────────────────────────────────────────────────────
function ResolveForm({
  incidentId,
  onDone,
}: {
  incidentId: string;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResolveIncidentFormValues>({
    resolver: zodResolver(resolveIncidentSchema),
  });
  const { mutateAsync } = useResolveIncident();

  const onSubmit = async (data: ResolveIncidentFormValues) => {
    try {
      await mutateAsync({ id: incidentId, payload: data });
      onDone();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="resolutionNote">
          Resolution note <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="resolutionNote"
          rows={3}
          placeholder="Describe how it was resolved (audit trail)..."
          {...register("resolutionNote")}
        />
        {errors.resolutionNote && (
          <p className="text-sm text-destructive">
            {errors.resolutionNote.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Mark as resolved
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── False alarm form ─────────────────────────────────────────────────────────
function FalseAlarmForm({
  incidentId,
  onDone,
}: {
  incidentId: string;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FalseAlarmFormValues>({
    resolver: zodResolver(falseAlarmSchema),
  });
  const { mutateAsync } = useFalseAlarmIncident();

  const onSubmit = async (data: FalseAlarmFormValues) => {
    try {
      await mutateAsync({ id: incidentId, payload: data });
      onDone();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="falseAlarmReason">
          False alarm reason <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="falseAlarmReason"
          rows={3}
          placeholder="Why this isn't a real incident..."
          {...register("falseAlarmReason")}
        />
        {errors.falseAlarmReason && (
          <p className="text-sm text-destructive">
            {errors.falseAlarmReason.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          Confirm false alarm
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Ambient Alert Detail Dialog (for sensor threshold breach alerts) ───────────

function AmbientAlertDetailDialog({
  alertId,
  basePath,
  siteName,
  onClose,
}: {
  alertId: string | null;
  basePath: string;
  siteName: (id?: string | null) => string | null;
  onClose: () => void;
}) {
  const { data: alert, isLoading } = useAlertDetail(alertId ?? "");
  const {
    code: ticketCode,
    status: ticketStatus,
    isLoading: ticketCodeLoading,
  } = useTicketCode(alert?.ticketId);
  // Ticket vừa tạo (Open) chưa được triage/assign — với Manager nó nằm ở Queue
  // (/manager/tickets/queue/:id), không phải danh sách ticket thường. Cùng quy tắc với
  // dialog alert của pin (AlertsView.tsx) — nếu không Manager bấm vào ticket Open từ đây
  // sẽ vào nhầm trang, "Back" đưa về sai chỗ.
  const ticketHref =
    alert?.ticketId == null
      ? null
      : basePath === "/manager" && ticketStatus === TicketStatusEnum.Open
        ? `${basePath}/tickets/queue/${alert.ticketId}`
        : `${basePath}/tickets/${alert.ticketId}`;
  const { mutate: resolve, isPending: resolvePending } = useResolveAlert();

  const canResolve =
    alert?.status === AlertStatusEnum.Open ||
    alert?.status === AlertStatusEnum.Acknowledged;

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
          <DialogTitle>Environmental alert details</DialogTitle>
          <DialogDescription>
            {alert
              ? `${siteName(alert.siteId) ?? "Site level"} · ${anomalyTypeLabel(alert.anomalyType)}`
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
            <DetailRow label="Measured value">
              <span className="font-mono-num">
                {alert.anomalyType === AnomalyTypeEnum.WaterLeak ||
                alert.unit?.toLowerCase() === "wet" ||
                alert.unit?.toLowerCase() === "bool"
                  ? "Wet"
                  : alert.actualValue == null
                    ? "—"
                    : `${alert.actualValue}${alert.unit ? ` ${alert.unit}` : ""}`}
              </span>
            </DetailRow>
            <DetailRow label="Threshold">
              <span className="font-mono-num">
                {alert.anomalyType === AnomalyTypeEnum.WaterLeak ||
                alert.unit?.toLowerCase() === "wet" ||
                alert.unit?.toLowerCase() === "bool"
                  ? "Wet"
                  : alert.thresholdValue == null
                    ? "—"
                    : `${alert.thresholdValue}${alert.unit ? ` ${alert.unit}` : ""}`}
              </span>
            </DetailRow>
            <DetailRow label="Customer">{alert.customerName || "—"}</DetailRow>
            <DetailRow label="Site">
              <span className="font-medium text-xs">
                {siteName(alert.siteId) ?? "—"}
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
                    {ticketCode ?? alert.ticketId.slice(0, 8)}
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
