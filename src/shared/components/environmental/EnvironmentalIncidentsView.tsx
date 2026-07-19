import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import AlertSeverityBadge from "@/shared/components/alerts/AlertSeverityBadge";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { handleErrorApi } from "@/shared/lib/errors";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { checkRole } from "@/shared/lib/authz";
import { UserRole } from "@/shared/types/account/session.types";
import {
  useIncidentList,
  useIncidentDetail,
  useAcknowledgeIncident,
  useResolveIncident,
  useFalseAlarmIncident,
} from "@/shared/hooks/alerts/useEnvironmentalIncidents";
import {
  EnvironmentalIncidentStatusEnum,
  EnvironmentalIncidentTypeEnum,
} from "@/shared/enums/alerts/environmental.enum";
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
import { incidentTypeLabel } from "@/shared/constants/incidentLabels";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

const DEFAULTS = {
  status: "",
  incidentType: "",
  siteId: "",
  from: "",
  to: "",
  pageNumber: 1,
  pageSize: 10,
};

const STATUS_OPTIONS = [
  EnvironmentalIncidentStatusEnum.Open,
  EnvironmentalIncidentStatusEnum.Acknowledged,
  EnvironmentalIncidentStatusEnum.Resolved,
  EnvironmentalIncidentStatusEnum.FalseAlarm,
];
const STATUS_LABELS: Record<EnvironmentalIncidentStatusEnum, string> = {
  [EnvironmentalIncidentStatusEnum.Open]: "Mở",
  [EnvironmentalIncidentStatusEnum.Acknowledged]: "Đã xác nhận",
  [EnvironmentalIncidentStatusEnum.Resolved]: "Đã xử lý",
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: "Báo động giả",
};

const TYPE_OPTIONS = [
  EnvironmentalIncidentTypeEnum.Smoke,
  EnvironmentalIncidentTypeEnum.FireDetected,
  EnvironmentalIncidentTypeEnum.GasLeak,
  EnvironmentalIncidentTypeEnum.Flood,
  EnvironmentalIncidentTypeEnum.OverheatHazard,
  EnvironmentalIncidentTypeEnum.Other,
];

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "—";

export default function EnvironmentalIncidentsView({
  subtitle,
  sites,
}: {
  subtitle: string;
  sites?: SiteOption[];
}) {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const siteNameById = new Map((sites ?? []).map((s) => [s.id, s.name]));
  const siteName = (id: string) => siteNameById.get(id) ?? id.slice(0, 8);

  const { data, isLoading } = useIncidentList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    siteId: filters.siteId || undefined,
    status: filters.status
      ? (Number(filters.status) as EnvironmentalIncidentStatusEnum)
      : undefined,
    incidentType: filters.incidentType
      ? (Number(filters.incidentType) as EnvironmentalIncidentTypeEnum)
      : undefined,
    from: filters.from || undefined,
    // to là date-only từ input → gửi cuối ngày để bao trọn ngày được chọn
    // (tránh loại các incident trong chính ngày `to`).
    to: filters.to ? `${filters.to}T23:59:59` : undefined,
  });
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {subtitle}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sự cố môi trường
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} sự cố &mdash; khói / cháy / rò khí
            / ngập / quá nhiệt cấp site
          </p>
        </div>
        {/* Cần danh sách site để chọn SiteId (field bắt buộc) → ẩn nút khi chưa có.
            Staff chỉ list được site sau khi BE mở GET /api/sites cho role Staff. */}
        {sites && sites.length > 0 && (
          <Button onClick={() => setReportOpen(true)}>Report thủ công</Button>
        )}
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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.incidentType || null}
          items={TYPE_OPTIONS.map((t) => ({
            value: String(t),
            label: incidentTypeLabel(t),
          }))}
          onValueChange={(v: string | null) =>
            setFilter("incidentType", v || undefined)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả loại</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={String(t)}>
                {incidentTypeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {sites && sites.length > 0 && (
          <Select
            value={filters.siteId || null}
            items={sites.map((s) => ({ value: s.id, label: s.name }))}
            onValueChange={(v: string | null) =>
              setFilter("siteId", v || undefined)
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tất cả site" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={null}>Tất cả site</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          type="date"
          className="w-40"
          value={filters.from || ""}
          onChange={(e) => setFilter("from", e.target.value || undefined)}
        />
        <Input
          type="date"
          className="w-40"
          value={filters.to || ""}
          onChange={(e) => setFilter("to", e.target.value || undefined)}
        />

        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
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
            <span className="text-sm">Chưa có sự cố nào.</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Loại sự cố</TableHead>
                <TableHead>{TABLE_COLUMNS.severity}</TableHead>
                <TableHead>{TABLE_COLUMNS.detectedAt}</TableHead>
                <TableHead>{TABLE_COLUMNS.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((incident, index) => (
                <TableRow
                  key={incident.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(incident.id)}
                >
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {siteName(incident.siteId)}
                  </TableCell>
                  <TableCell>
                    <IncidentTypeBadge incidentType={incident.incidentType} />
                  </TableCell>
                  <TableCell>
                    <AlertSeverityBadge severity={incident.severity} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(incident.detectedAt)}
                  </TableCell>
                  <TableCell>
                    <IncidentStatusBadge status={incident.status} />
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

      <IncidentDetailDialog
        incidentId={selectedId}
        siteName={siteName}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

// ── Detail dialog ───────────────────────────────────────────────────────────
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
  const { mutate: acknowledge, isPending: ackPending } =
    useAcknowledgeIncident();

  const [panel, setPanel] = useState<"none" | "resolve" | "falseAlarm">("none");

  const status = incident?.status;
  const canAck = status === EnvironmentalIncidentStatusEnum.Open;
  const canResolve =
    status === EnvironmentalIncidentStatusEnum.Open ||
    status === EnvironmentalIncidentStatusEnum.Acknowledged;
  const canMarkFalseAlarm =
    canFalseAlarm &&
    (status === EnvironmentalIncidentStatusEnum.Open ||
      status === EnvironmentalIncidentStatusEnum.Acknowledged);

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
          <DialogTitle>Chi tiết sự cố</DialogTitle>
          <DialogDescription>
            {incident
              ? `${siteName(incident.siteId)} · ${incidentTypeLabel(incident.incidentType)}`
              : "Đang tải..."}
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
            <DetailRow label="Loại">
              <IncidentTypeBadge incidentType={incident.incidentType} />
            </DetailRow>
            <DetailRow label="Mức độ">
              <AlertSeverityBadge severity={incident.severity} />
            </DetailRow>
            <DetailRow label="Trạng thái">
              <IncidentStatusBadge status={incident.status} />
            </DetailRow>
            <DetailRow label="Báo cáo bởi">
              {incident.reportedBy ?? "—"}
            </DetailRow>
            <DetailRow label="Phát hiện lúc">
              {formatDateTime(incident.detectedAt)}
            </DetailRow>
            <DetailRow label="Xác nhận lúc">
              {formatDateTime(incident.acknowledgedAt)}
            </DetailRow>
            <DetailRow label="Xử lý lúc">
              {formatDateTime(incident.resolvedAt)}
            </DetailRow>
            {incident.resolutionNote && (
              <DetailRow label="Ghi chú xử lý">
                {incident.resolutionNote}
              </DetailRow>
            )}
            {incident.falseAlarmReason && (
              <DetailRow label="Lý do báo giả">
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
            <Button
              variant="outline"
              disabled={!canAck || ackPending}
              onClick={() => acknowledge(incident.id)}
            >
              Xác nhận
            </Button>
            {canMarkFalseAlarm && (
              <Button variant="outline" onClick={() => setPanel("falseAlarm")}>
                Báo động giả
              </Button>
            )}
            <Button disabled={!canResolve} onClick={() => setPanel("resolve")}>
              Xử lý
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Resolve form ────────────────────────────────────────────────────────────
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
        <Label htmlFor="resolutionNote">Ghi chú xử lý *</Label>
        <Textarea
          id="resolutionNote"
          rows={3}
          placeholder="Mô tả cách xử lý (audit trail)..."
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
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Đánh dấu đã xử lý
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── False alarm form ────────────────────────────────────────────────────────
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
        <Label htmlFor="falseAlarmReason">Lý do báo động giả *</Label>
        <Textarea
          id="falseAlarmReason"
          rows={3}
          placeholder="Vì sao đây không phải sự cố thật..."
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
          Hủy
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          Xác nhận báo động giả
        </Button>
      </DialogFooter>
    </form>
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
