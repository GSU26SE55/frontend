import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Thermometer, Droplets, Sun, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  useAmbientThresholdBySite,
  useAmbientLatest,
  useAmbientHistory,
  useUpsertAmbientThreshold,
} from "@/shared/hooks/ambient/useAmbient";
import {
  ambientThresholdSchema,
  type AmbientThresholdFormValues,
} from "@/shared/schemas/ambient/ambient.schema";
import { AmbientReadingSourceEnum } from "@/shared/enums/ambient/ambient.enum";
import type { AmbientThresholdUpsertPayload } from "@/shared/types/ambient/ambient.types";
import type { SiteOption } from "@/shared/types/site/site.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

const SOURCE_LABELS: Record<AmbientReadingSourceEnum, string> = {
  [AmbientReadingSourceEnum.IotSensor]: "IoT sensor",
  [AmbientReadingSourceEnum.WeatherApi]: "Weather API",
};

const toNumOrNull = (val?: string): number | null => {
  if (!val || val.trim() === "") return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
};

const fmt = (v?: number | null, unit = "") =>
  v === null || v === undefined ? "—" : `${v}${unit}`;

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "—";

// ── Site selector (reused in 2 places) ─────────────────────────────────

function SiteSelect({
  sites,
  value,
  onChange,
  className,
}: {
  sites: SiteOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <Select
      value={value || null}
      items={sites.map((s) => ({ value: s.id, label: s.name }))}
      onValueChange={(v: string | null) => onChange(v ?? "")}
    >
      <SelectTrigger className={className ?? "w-56"}>
        <SelectValue placeholder="Select a site..." />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {sites.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Site-scoped panel ─────────────────────────────────────────────────────
// Used when siteId is already known (embedded in Site detail) → no site selector needed.
// AmbientConfigView (the standalone page) reuses this exact panel after a site is picked.

export function AmbientSitePanel({ siteId }: { siteId: string }) {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <LatestStrip siteId={siteId} />
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
          <Settings2 size={14} />
          Configure threshold
        </Button>
      </div>

      <HistoryTable siteId={siteId} />

      <ThresholdPanel
        siteId={siteId}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      />
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function AmbientConfigView({
  subtitle,
  sites,
}: {
  subtitle: string;
  sites: SiteOption[];
}) {
  const [siteId, setSiteId] = useState("");
  const [configOpen, setConfigOpen] = useState(false);

  return (
    // min-h full so empty state can center; natural height when content loaded
    <div className="flex flex-col min-h-[calc(100vh-65px)]">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 shrink-0 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {subtitle}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Site environment
          </h1>
        </div>
        {/* Controls only visible when a site is already selected */}
        {siteId && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Site</Label>
              <SiteSelect sites={sites} value={siteId} onChange={setSiteId} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigOpen(true)}
            >
              <Settings2 size={14} />
              Configure threshold
            </Button>
            <RefreshButton queryKeys={[KEY.ambient]} />
          </div>
        )}
      </div>

      {!siteId ? (
        /* ── Empty state — selector centered on page ───────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6 pb-16">
          <div>
            <p className="text-sm font-medium">Select a site to get started</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-65">
              Temperature, humidity, and reading history will show up here
            </p>
          </div>
          <SiteSelect
            sites={sites}
            value={siteId}
            onChange={setSiteId}
            className="w-64"
          />
        </div>
      ) : (
        /* ── Content — natural height, no forced fill ──────────────────── */
        <div className="px-6 pb-8 space-y-4">
          <LatestStrip siteId={siteId} />
          <HistoryTable siteId={siteId} />
        </div>
      )}

      {/* ── Threshold drawer ──────────────────────────────────────────── */}
      {siteId && (
        <ThresholdPanel
          siteId={siteId}
          open={configOpen}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </div>
  );
}

// ── Latest metric strip ─────────────────────────────────────────────────

function LatestStrip({ siteId }: { siteId: string }) {
  const { data: latest, isLoading, isError } = useAmbientLatest(siteId);

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-xl" />;
  }
  if (isError || !latest) {
    return (
      <div className="flex items-center px-4 py-3 border border-border rounded-xl text-sm text-muted-foreground">
        No environmental data for this site yet.
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-5 px-5 py-3 border border-border rounded-xl bg-card">
      <MetricItem
        icon={<Thermometer className="size-4 text-orange-500" />}
        label="Temperature"
        value={fmt(latest.ambientTemperature, " °C")}
      />
      <Separator orientation="vertical" className="h-7" />
      <MetricItem
        icon={<Droplets className="size-4 text-blue-500" />}
        label="Humidity"
        value={fmt(latest.humidity, " %")}
      />
      <Separator orientation="vertical" className="h-7" />
      <MetricItem
        icon={<Sun className="size-4 text-amber-500" />}
        label="Irradiance"
        value={fmt(latest.solarIrradiance, " W/m²")}
      />
    </div>
  );
}

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Threshold panel (Drawer) ────────────────────────────────────────────

function ThresholdPanel({
  siteId,
  open,
  onClose,
}: {
  siteId: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="sm:max-w-120">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="text-base font-semibold">
            Alert threshold
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Configure the site's environmental monitoring threshold
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ThresholdFormBody siteId={siteId} onSaved={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ── Threshold form body ──────────────────────────────────────────────────

function ThresholdFormBody({
  siteId,
  onSaved,
}: {
  siteId: string;
  onSaved?: () => void;
}) {
  const { data: threshold, isError } = useAmbientThresholdBySite(siteId);
  const { mutateAsync } = useUpsertAmbientThreshold();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AmbientThresholdFormValues>({
    resolver: zodResolver(ambientThresholdSchema),
    defaultValues: { siteId, enabled: true },
  });

  useEffect(() => {
    if (threshold) {
      reset({
        siteId,
        highAmbientTempWarning:
          threshold.highAmbientTempWarning?.toString() ?? "",
        highAmbientTempCritical:
          threshold.highAmbientTempCritical?.toString() ?? "",
        highHumidityWarning: threshold.highHumidityWarning?.toString() ?? "",
        highHumidityCritical: threshold.highHumidityCritical?.toString() ?? "",
        comboTempThreshold: threshold.comboTempThreshold?.toString() ?? "",
        comboHumidityThreshold:
          threshold.comboHumidityThreshold?.toString() ?? "",
        enabled: threshold.enabled,
      });
    } else if (isError) {
      reset({
        siteId,
        highAmbientTempWarning: "",
        highAmbientTempCritical: "",
        highHumidityWarning: "",
        highHumidityCritical: "",
        comboTempThreshold: "",
        comboHumidityThreshold: "",
        enabled: true,
      });
    }
  }, [siteId, threshold, isError, reset]);

  const onSubmit = async (data: AmbientThresholdFormValues) => {
    const payload: AmbientThresholdUpsertPayload = {
      siteId: data.siteId,
      highAmbientTempWarning: toNumOrNull(data.highAmbientTempWarning),
      highAmbientTempCritical: toNumOrNull(data.highAmbientTempCritical),
      highHumidityWarning: toNumOrNull(data.highHumidityWarning),
      highHumidityCritical: toNumOrNull(data.highHumidityCritical),
      comboTempThreshold: toNumOrNull(data.comboTempThreshold),
      comboHumidityThreshold: toNumOrNull(data.comboHumidityThreshold),
      enabled: data.enabled,
    };
    try {
      await mutateAsync(payload);
      onSaved?.();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("siteId")} />

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Temperature
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Warning (°C)"
            error={errors.highAmbientTempWarning?.message}
            {...register("highAmbientTempWarning")}
          />
          <NumField
            label="Critical (°C)"
            error={errors.highAmbientTempCritical?.message}
            {...register("highAmbientTempCritical")}
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Humidity
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Warning (%)"
            error={errors.highHumidityWarning?.message}
            {...register("highHumidityWarning")}
          />
          <NumField
            label="Critical (%)"
            error={errors.highHumidityCritical?.message}
            {...register("highHumidityCritical")}
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Combo rule
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Temp threshold (°C)"
            error={errors.comboTempThreshold?.message}
            {...register("comboTempThreshold")}
          />
          <NumField
            label="Humidity threshold (%)"
            error={errors.comboHumidityThreshold?.message}
            {...register("comboHumidityThreshold")}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="enabled"
            render={({ field }) => (
              <Checkbox
                id="enabled"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="enabled" className="text-sm">
            Enable threshold monitoring
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Leaving a field blank means that metric isn't monitored. The combo
          rule only activates when both combo thresholds have a value.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Save configuration"}
      </Button>
    </form>
  );
}

function NumField({
  label,
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" step="any" {...rest} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── History table — natural height, no forced fill ──────────────────────

function HistoryTable({ siteId }: { siteId: string }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading } = useAmbientHistory({
    siteId,
    pageNumber,
    pageSize,
  });
  const items = data?.items ?? [];

  return (
    <div>
      <div className="pb-3">
        <h2 className="text-sm font-medium">Environmental data history</h2>
      </div>

      {/* Bordered table — height = content, no empty space */}
      <div className="border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No environmental data yet.
          </div>
        ) : (
          <Table className="table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Humidity</TableHead>
                <TableHead>Irradiance</TableHead>
                <TableHead>{TABLE_COLUMNS.source}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r, index) => (
                <TableRow key={r.time}>
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {(pageNumber - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatDateTime(r.time)}
                  </TableCell>
                  <TableCell>{fmt(r.ambientTemperature, " °C")}</TableCell>
                  <TableCell>{fmt(r.humidity, " %")}</TableCell>
                  <TableCell>{fmt(r.solarIrradiance, " W/m²")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {SOURCE_LABELS[r.source] ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="pt-3">
        <DataPagination
          totalItems={data?.totalItems ?? 0}
          totalPages={data?.totalPages ?? 1}
          hasNextPage={data?.hasNextPage ?? false}
          hasPreviousPage={data?.hasPreviousPage ?? false}
          pageNumber={pageNumber}
          pageSize={pageSize}
          onPageChange={setPageNumber}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPageNumber(1);
          }}
        />
      </div>
    </div>
  );
}
