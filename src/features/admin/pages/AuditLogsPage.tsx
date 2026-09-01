import { useState } from "react";
import {
  ScrollText,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Monitor,
  Globe,
  Fingerprint,
  Clock,
  Hash,
  User,
  ShieldAlert,
  Copy,
  Download,
  RotateCcw,
  UserX,
  Activity,
  Layers,
  ShieldCheck,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { RevealInline } from "@/shared/motion/RevealInline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  useAuditSearch,
  useAuditCorrelation,
  useAuditReplay,
  useAuditReplayJob,
  useAuditRedact,
} from "@/features/admin/hooks/account/useAuditAggregator";
import { auditAggregatorService } from "@/features/admin/services/account/audit-aggregator.service";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import type {
  AuditAggregateDto,
  AuditSearchParams,
} from "@/features/admin/types/account/audit-aggregator.types";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { toneClass } from "@/shared/theme/statusColors";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { noData, notFound } from "@/shared/constants/emptyStates";
import { parseUserAgent } from "@/shared/utils/userAgent";
import {
  AuditSeverity,
  AuditActionCategory,
} from "@/shared/enums/account/audit.enum";

// ── Metadata & Configuration ──────────────────────────────────────────────────

const SERVICES = [
  "AuthService",
  "BatteryService",
  "TicketService",
  "NotificationService",
  "FileStorageService",
  "SmsService",
] as const;

const CATEGORIES = Object.values(AuditActionCategory);
const SEVERITIES = Object.values(AuditSeverity);

const CATEGORY_STYLE: Record<string, string> = {
  Authentication:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  Authorization:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  AccountManagement:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  DataModification:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  DataAccess:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  Configuration:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Security:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  Communication:
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800",
  System:
    "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
};

const SEVERITY_STYLE: Record<string, string> = {
  Info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  Warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Critical:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  Security:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (dt?: string) => {
  if (!dt) return "—";
  try {
    return format(new Date(dt), "dd/MM/yyyy HH:mm:ss", { locale: enUS });
  } catch {
    return dt;
  }
};

const fmtFull = (dt?: string) => {
  if (!dt) return "—";
  try {
    return format(new Date(dt), "EEEE, dd/MM/yyyy 'at' HH:mm:ss", {
      locale: enUS,
    });
  } catch {
    return dt;
  }
};

function parseMetadata(raw?: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Detail Rows ───────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 min-w-0">
      <div className="mt-0.5 shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function CopyIdRow({
  icon: Icon,
  label,
  value,
  onAction,
  actionLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex gap-3 min-w-0 items-center">
      <div className="shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-xs font-mono text-foreground truncate">{value}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onAction && actionLabel && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`Copy ${label}`}
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Correlation Trace Modal ───────────────────────────────────────────────────

function CorrelationTraceDialog({
  correlationId,
  open,
  onClose,
  onSelectEvent,
}: {
  correlationId: string | null;
  open: boolean;
  onClose: () => void;
  onSelectEvent: (event: AuditAggregateDto) => void;
}) {
  const { data: events, isLoading } = useAuditCorrelation(
    correlationId ?? undefined,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <DialogTitle className="text-lg">
              Correlation Flow Trace
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-mono break-all mt-1">
            Correlation ID: {correlationId}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No correlated events found in read-store for this ID.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {events.map((ev, idx) => {
                const isFailed = !ev.isSuccess;
                return (
                  <div
                    key={ev.id}
                    className="relative bg-card rounded-lg border border-border p-3.5 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      onSelectEvent(ev);
                      onClose();
                    }}
                  >
                    <div
                      className={`absolute -left-6 top-4 size-3 rounded-full border-2 bg-background ${
                        isFailed ? "border-red-500" : "border-emerald-500"
                      }`}
                    />
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <Badge variant="outline" className="text-2xs font-mono">
                          {ev.serviceName}
                        </Badge>
                        <span className="font-semibold text-sm">
                          {ev.actionCode}
                        </span>
                      </div>
                      <span className="text-2xs text-muted-foreground font-mono">
                        {fmt(ev.occurredAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Actor:{" "}
                        {ev.actorDisplay ?? ev.actorAccountId ?? "System"}
                      </span>
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          ev.isSuccess ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {ev.isSuccess ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {ev.isSuccess ? "Success" : "Failed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Replay Dialog ─────────────────────────────────────────────────────────────

function AuditReplayDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [service, setService] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const replayMutation = useAuditReplay();
  const { data: jobStatus, isLoading: isJobLoading } = useAuditReplayJob(
    activeJobId ?? undefined,
  );

  const handleStartReplay = async () => {
    try {
      const res = await replayMutation.mutateAsync({
        service: service || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      });
      const dataObj = res.data?.data as { jobId?: string } | undefined;
      if (dataObj?.jobId) {
        setActiveJobId(dataObj.jobId);
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setActiveJobId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="size-5 text-primary" />
            <DialogTitle>Audit Replay Tool</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            Replay audit events from microservice source outbox tables into the
            unified read-store (
            <code className="font-mono">audit_aggregate</code>). Consumer is
            idempotent and will not create duplicates.
          </DialogDescription>
        </DialogHeader>

        {activeJobId && jobStatus ? (
          <div className="space-y-4 py-3">
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Job Status
                </span>
                <Badge
                  variant={
                    jobStatus.status === "Completed"
                      ? "default"
                      : jobStatus.status === "CompletedWithErrors"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {jobStatus.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Progress:</p>
                  <p className="font-semibold">
                    {jobStatus.completedServices} / {jobStatus.totalServices}{" "}
                    services
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Events Replayed:</p>
                  <p className="font-semibold">
                    {jobStatus.totalEventsReplayed.toLocaleString()}
                  </p>
                </div>
              </div>

              {jobStatus.pendingServices &&
                jobStatus.pendingServices.length > 0 && (
                  <div>
                    <p className="text-2xs text-muted-foreground uppercase mb-1">
                      Pending Services:
                    </p>
                    <p className="text-xs font-mono">
                      {jobStatus.pendingServices.join(", ")}
                    </p>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Service Source
              </label>
              <Select
                value={service}
                items={[
                  { value: null, label: "All Services" },
                  ...SERVICES.map((s) => ({ value: s, label: s })),
                ]}
                onValueChange={(v) => setService(v)}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value={null}>All Services</SelectItem>
                  {SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  From (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  To (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {activeJobId ? "Dismiss" : "Cancel"}
          </Button>
          {!activeJobId && (
            <Button
              onClick={handleStartReplay}
              disabled={replayMutation.isPending || isJobLoading}
            >
              {replayMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trigger Replay
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── GDPR Redact Dialog ────────────────────────────────────────────────────────

function AuditRedactDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState("");
  const redactMutation = useAuditRedact();

  const handleRedact = async () => {
    if (!accountId.trim()) {
      toast.error("Please enter a valid Account ID.");
      return;
    }
    try {
      await redactMutation.mutateAsync(accountId.trim());
      setAccountId("");
      onClose();
    } catch {
      // Handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <UserX className="size-5" />
            <DialogTitle>GDPR PII Redact</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed mt-1.5">
            Executes GDPR &quot;Right to be Forgotten&quot; on the audit
            read-store. Personal information (display name, IP address) for this
            account will be permanently replaced with{" "}
            <code className="font-mono">[REDACTED]</code>. Event IDs, action
            codes, and timestamps are preserved for compliance integrity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Account ID (UUID)
            </label>
            <Input
              placeholder="e.g. 01923e45-789a-7b8c-9def-0123456789ab"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRedact}
            disabled={redactMutation.isPending || !accountId.trim()}
          >
            {redactMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Redact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Audit Log Detail Drawer ───────────────────────────────────────────────────

function AuditLogDetailDrawer({
  log,
  open,
  onClose,
  onTraceCorrelation,
}: {
  log: AuditAggregateDto | null;
  open: boolean;
  onClose: () => void;
  onTraceCorrelation: (correlationId: string) => void;
}) {
  if (!log) return null;

  const metadata = parseMetadata(log.metadataJson);
  const ua = parseUserAgent(log.actorUserAgent);
  const category = log.actionCategory ?? "Other";
  const severity = log.severity ?? "Info";

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="sm:max-w-140">
        {/* Header */}
        <DrawerHeader className="border-b border-border p-0">
          <div className="flex items-start gap-3 px-6 py-5">
            <div
              className={`mt-0.5 size-9 rounded-lg flex items-center justify-center border shrink-0 ${
                CATEGORY_STYLE[category] ?? "bg-muted text-muted-foreground"
              }`}
            >
              <ShieldAlert size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-3xs font-mono font-bold"
                >
                  {log.serviceName}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-3xs font-semibold px-2 py-0 border ${
                    SEVERITY_STYLE[severity] ?? ""
                  }`}
                >
                  {severity}
                </Badge>
              </div>
              <DrawerTitle className="text-base font-semibold leading-tight mt-1">
                {log.actionCode}
              </DrawerTitle>
              <p className="text-2xs text-muted-foreground font-mono mt-0.5">
                Category: {category}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 text-2xs font-semibold ${toneClass(
                log.isSuccess ? "ok" : "p1",
              )}`}
            >
              {log.isSuccess ? (
                <CheckCircle2 size={12} className="mr-1" />
              ) : (
                <XCircle size={12} className="mr-1" />
              )}
              {log.isSuccess ? "Success" : "Failed"}
            </Badge>
          </div>
        </DrawerHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Timing & Identifiers */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Timing & Identifiers
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={Clock}
                label="Occurred At (UTC)"
                value={fmtFull(log.occurredAt)}
              />
              <DetailRow
                icon={Clock}
                label="Recorded At (Source)"
                value={fmtFull(log.recordedAt)}
              />
              <CopyIdRow icon={Hash} label="Event ID" value={log.eventId} />
              <CopyIdRow icon={Hash} label="Read-Store ID" value={log.id} />
              {log.correlationId && (
                <CopyIdRow
                  icon={Activity}
                  label="Correlation ID"
                  value={log.correlationId}
                  actionLabel="Trace Flow"
                  onAction={() => onTraceCorrelation(log.correlationId!)}
                />
              )}
              {log.causationId && (
                <CopyIdRow
                  icon={ArrowRight}
                  label="Causation ID"
                  value={log.causationId}
                />
              )}
            </div>
          </section>

          <Separator />

          {/* Actor */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actor (Performed By)
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={User}
                label="Actor Display"
                value={
                  log.actorDisplay ?? (
                    <span className="text-muted-foreground italic">
                      System / Anonymous
                    </span>
                  )
                }
              />
              {log.actorRole && (
                <DetailRow
                  icon={ShieldCheck}
                  label="Actor Role"
                  value={<Badge variant="outline">{log.actorRole}</Badge>}
                />
              )}
              {log.actorAccountId && (
                <CopyIdRow
                  icon={Hash}
                  label="Actor Account ID"
                  value={log.actorAccountId}
                />
              )}
            </div>
          </section>

          <Separator />

          {/* Target */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target (Affected Entity)
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={Layers}
                label="Target Type"
                value={log.targetType ?? "—"}
              />
              {log.targetDisplay && (
                <DetailRow
                  icon={User}
                  label="Target Display"
                  value={log.targetDisplay}
                />
              )}
              {log.targetId && (
                <CopyIdRow icon={Hash} label="Target ID" value={log.targetId} />
              )}
            </div>
          </section>

          <Separator />

          {/* Device & Network (from ActorUserAgent and Geo) */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Device, Browser & Network
            </h3>
            <div className="space-y-3">
              {log.actorIp && (
                <DetailRow
                  icon={Globe}
                  label="IP Address"
                  value={log.actorIp}
                  mono
                />
              )}
              {(log.geoCity || log.geoCountry) && (
                <DetailRow
                  icon={Globe}
                  label="Geo Location"
                  value={
                    <span>
                      {log.geoCity ? `${log.geoCity}, ` : ""}
                      {log.geoCountry ?? "Unknown Country"}
                    </span>
                  }
                />
              )}
              {ua ? (
                <DetailRow
                  icon={Monitor}
                  label="Browser & Device"
                  value={
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">
                        {ua.browser} · {ua.os}
                      </p>
                      <p className="text-2xs text-muted-foreground font-mono break-all leading-relaxed bg-muted/50 p-2 rounded border border-border">
                        {ua.full}
                      </p>
                    </div>
                  }
                />
              ) : log.actorUserAgent ? (
                <DetailRow
                  icon={Monitor}
                  label="User Agent"
                  value={
                    <p className="text-2xs text-muted-foreground font-mono break-all leading-relaxed bg-muted/50 p-2 rounded border border-border">
                      {log.actorUserAgent}
                    </p>
                  }
                />
              ) : (
                <DetailRow
                  icon={Fingerprint}
                  label="User Agent"
                  value={
                    <span className="text-muted-foreground text-xs italic">
                      No User-Agent header recorded (System/Internal action)
                    </span>
                  }
                />
              )}
            </div>
          </section>

          {/* Error / Failure Details */}
          {(!log.isSuccess || log.errorCode || log.reason) && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider">
                  Error & Reason
                </h3>
                <div className="space-y-2 text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  {log.errorCode && (
                    <p>
                      <span className="font-semibold">Error Code:</span>{" "}
                      <code className="font-mono text-xs">{log.errorCode}</code>
                    </p>
                  )}
                  {log.reason && (
                    <p>
                      <span className="font-semibold">Reason:</span>{" "}
                      {log.reason}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Metadata */}
          {metadata && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Metadata JSON
                </h3>
                <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border">
                  {Object.entries(metadata).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="text-2xs font-mono text-muted-foreground shrink-0 pt-0.5 w-32 truncate">
                        {k}
                      </span>
                      <span className="text-xs font-mono break-all text-foreground">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t border-border">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

const DEFAULTS: {
  keyword: string;
  service?: string;
  category?: string;
  severity?: string;
  status?: string;
  from: string;
  to: string;
  pageNumber: number;
  pageSize: number;
} = {
  keyword: "",
  service: undefined,
  category: undefined,
  severity: undefined,
  status: undefined,
  from: "",
  to: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export default function AuditLogsPage() {
  const [selected, setSelected] = useState<AuditAggregateDto | null>(null);
  const [traceCorrelationId, setTraceCorrelationId] = useState<string | null>(
    null,
  );
  const [replayOpen, setReplayOpen] = useState(false);
  const [redactOpen, setRedactOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  // Convert status to boolean
  const isSuccessParam =
    filters.status === "success"
      ? true
      : filters.status === "failed"
        ? false
        : undefined;

  const queryParams: AuditSearchParams = {
    service: filters.service || undefined,
    category: filters.category || undefined,
    severity: filters.severity || undefined,
    isSuccess: isSuccessParam,
    action: filters.keyword ? filters.keyword.trim() : undefined,
    from: filters.from ? new Date(filters.from).toISOString() : undefined,
    to: filters.to ? new Date(filters.to).toISOString() : undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading } = useAuditSearch(queryParams);
  const logs = data?.items ?? [];
  const total = data?.totalItems ?? 0;

  const handleExport = async (formatType: "csv" | "json") => {
    setIsExporting(true);
    try {
      await auditAggregatorService.export(
        {
          service: queryParams.service,
          category: queryParams.category,
          severity: queryParams.severity,
          isSuccess: queryParams.isSuccess,
          action: queryParams.action,
          from: queryParams.from,
          to: queryParams.to,
        },
        formatType,
      );
      toast.success(`Audit logs exported as ${formatType.toUpperCase()}`);
    } catch {
      toast.error("Failed to export audit logs. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Compliance
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Audit logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "…" : total.toLocaleString()} audit events &mdash;
            cross-service unified audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Replay Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReplayOpen(true)}
          >
            <RotateCcw className="size-3.5" />
            Replay
          </Button>

          {/* Redact Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setRedactOpen(true)}
          >
            <UserX className="size-3.5" />
            GDPR Redact
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  Export
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="size-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <FileCode className="size-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <RefreshButton queryKeys={[KEY.auditAggregate]} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search action, actor, target..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>

        {/* Service Select */}
        <Select
          value={filters.service || null}
          items={[
            { value: null, label: "All services" },
            ...SERVICES.map((s) => ({ value: s, label: s })),
          ]}
          onValueChange={(v) => setFilter("service", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All services</SelectItem>
            {SERVICES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Select */}
        <Select
          value={filters.category || null}
          items={[
            { value: null, label: "All categories" },
            ...CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          onValueChange={(v) => setFilter("category", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity Select */}
        <Select
          value={filters.severity || null}
          items={[
            { value: null, label: "All severities" },
            ...SEVERITIES.map((sev) => ({ value: sev, label: sev })),
          ]}
          onValueChange={(v) => setFilter("severity", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All severities</SelectItem>
            {SEVERITIES.map((sev) => (
              <SelectItem key={sev} value={sev}>
                {sev}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Result Select */}
        <Select
          value={filters.status || null}
          items={[
            { value: null, label: "All results" },
            { value: "success", label: "Success" },
            { value: "failed", label: "Failed" },
          ]}
          onValueChange={(v) => setFilter("status", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="All results" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All results</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Pickers */}
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

        <RevealInline show={hasActiveFilter}>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear filters
          </Button>
        </RevealInline>
      </div>

      {/* Main Table Card */}
      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <ScrollText size={32} className="opacity-30" />
            <span className="text-sm">
              {hasActiveFilter
                ? notFound("audit events")
                : noData("audit events")}
            </span>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead className="w-[16%]">{TABLE_COLUMNS.time}</TableHead>
                <TableHead className="w-[14%]">Service</TableHead>
                <TableHead className="w-[24%]">Action</TableHead>
                <TableHead className="w-[10%]">Result</TableHead>
                <TableHead className="w-[20%]">Actor</TableHead>
                <TableHead className="w-[16%]">Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => {
                const category = log.actionCategory ?? "System";

                return (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelected(log)}
                  >
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs font-mono">
                      {fmt(log.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-3xs font-mono">
                        {log.serviceName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-3xs font-medium px-1.5 py-0 border shrink-0 ${
                            CATEGORY_STYLE[category] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {category}
                        </Badge>
                        <span className="font-medium text-xs truncate">
                          {log.actionCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-3xs font-semibold px-2 py-0.5 ${toneClass(
                          log.isSuccess ? "ok" : "p1",
                        )}`}
                      >
                        {log.isSuccess ? (
                          <CheckCircle2 size={10} className="mr-1" />
                        ) : (
                          <XCircle size={10} className="mr-1" />
                        )}
                        {log.isSuccess ? "OK" : "FAIL"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs truncate font-mono text-muted-foreground">
                      {log.actorDisplay ?? log.actorAccountId ?? (
                        <span className="italic">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs truncate">
                          {log.targetDisplay ?? log.targetType ?? "—"}
                        </span>
                        <ChevronRight
                          size={14}
                          className="opacity-30 shrink-0"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />

      {/* Detail Drawer */}
      <AuditLogDetailDrawer
        log={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onTraceCorrelation={(corrId) => setTraceCorrelationId(corrId)}
      />

      {/* Correlation Trace Dialog */}
      <CorrelationTraceDialog
        correlationId={traceCorrelationId}
        open={!!traceCorrelationId}
        onClose={() => setTraceCorrelationId(null)}
        onSelectEvent={(ev) => setSelected(ev)}
      />

      {/* Replay Modal */}
      <AuditReplayDialog
        open={replayOpen}
        onClose={() => setReplayOpen(false)}
      />

      {/* Redact Modal */}
      <AuditRedactDialog
        open={redactOpen}
        onClose={() => setRedactOpen(false)}
      />
    </PageContainer>
  );
}
