import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Thermometer, Wind, Droplet, Settings2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DataPagination from "@/shared/components/ui/DataPagination";
import { DateTimePicker } from "@/shared/components/ui/DatePicker";
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
import {
  evaluateAmbientRow,
  ambientLevelTextClass,
} from "@/shared/lib/ambientThresholds";
import type { AmbientThresholdUpsertPayload } from "@/shared/types/ambient/ambient.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { formatDateTime } from "@/shared/utils/datetime";

const SOURCE_LABELS: Record<AmbientReadingSourceEnum, string> = {
  [AmbientReadingSourceEnum.IotSensor]: "Sensor",
  [AmbientReadingSourceEnum.WeatherApi]: "Sensor",
};

const toNumOrNull = (val?: string): number | null => {
  if (!val || val.trim() === "") return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
};

const fmt = (v?: number | null, unit = "") =>
  v === null || v === undefined ? "—" : `${v}${unit}`;

const fmtWater = (v?: boolean | null) =>
  v === null || v === undefined ? "—" : v ? "Wet" : "Dry";

// datetime-local (local time, no timezone) → ISO UTC for the API. "" → undefined.
const toUtcIso = (local: string): string | undefined =>
  local ? new Date(local).toISOString() : undefined;

// ISO from the URL → the "YYYY-MM-DDTHH:mm" shape datetime-local needs, in LOCAL time.
// Slicing the ISO string directly would show UTC and shift the window by the tz offset.
const toLocalInput = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── Site selector (reused in 2 places) ─────────────────────────────────

// ── Site-scoped panel ─────────────────────────────────────────────────────
// The only entry point to ambient data: rendered by the "Environment" tab on the Site
// detail page (admin + manager), where siteId is already known — so no site selector.

export function AmbientSitePanel({
  siteId,
  from,
  to,
  onClearWindow,
}: {
  siteId: string;
  /** Start of a pre-applied time window (ISO) — set when a ticket links here. */
  from?: string;
  /** End of a pre-applied time window (ISO). */
  to?: string;
  onClearWindow?: () => void;
}) {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <LatestStrip siteId={siteId} />
        {/* No refresh button here: this panel is a tab inside the site detail page, whose
            header button already invalidates KEY.ambient alongside KEY.sites. A second one
            beside it looked like two different refreshes for the same screen. */}
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
          <Settings2 size={14} />
          Configure threshold
        </Button>
      </div>

      <HistoryTable
        siteId={siteId}
        from={from}
        to={to}
        onClearWindow={onClearWindow}
      />

      <ThresholdPanel
        siteId={siteId}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      />
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
        icon={<Wind className="size-4 text-emerald-500" />}
        label="Gas"
        value={fmt(latest.gasConcentration, " %")}
      />
      <Separator orientation="vertical" className="h-7" />
      <MetricItem
        icon={<Droplet className="size-4 text-cyan-500" />}
        label="Water"
        value={fmtWater(latest.waterLeakDetected)}
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
        <p className="text-2xs text-muted-foreground leading-none mb-0.5">
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
        highGasWarning: threshold.highGasWarning?.toString() ?? "",
        highGasCritical: threshold.highGasCritical?.toString() ?? "",
        comboTempThreshold: threshold.comboTempThreshold?.toString() ?? "",
        comboHumidityThreshold:
          threshold.comboHumidityThreshold?.toString() ?? "",
        enabled: threshold.enabled,
      });
    } else if (threshold === null || isError) {
      // threshold === null: BE says the site has no config yet (200 + data: null) → create
      // mode with empty fields. isError is kept for a genuine failure (403/500), which lands
      // on the same blank form rather than on stale values from a previously viewed site.
      reset({
        siteId,
        highAmbientTempWarning: "",
        highAmbientTempCritical: "",
        highHumidityWarning: "",
        highHumidityCritical: "",
        highGasWarning: "",
        highGasCritical: "",
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
      highGasWarning: toNumOrNull(data.highGasWarning),
      highGasCritical: toNumOrNull(data.highGasCritical),
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
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Gas Concentration (Khí Gas)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Warning (%)"
            error={errors.highGasWarning?.message}
            {...register("highGasWarning")}
          />
          <NumField
            label="Critical (%)"
            error={errors.highGasCritical?.message}
            {...register("highGasCritical")}
          />
        </div>
      </div>

      <div>
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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

function HistoryTable({
  siteId,
  from,
  to,
  onClearWindow,
}: {
  siteId: string;
  from?: string;
  to?: string;
  onClearWindow?: () => void;
}) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Manual range (datetime-local strings). The URL window from a ticket link is the initial
  // value; typing in the pickers takes over from there, so one control drives the query
  // instead of two competing sources.
  const [fromLocal, setFromLocal] = useState(() => toLocalInput(from));
  const [toLocalValue, setToLocalValue] = useState(() => toLocalInput(to));

  // A new URL window (different incident) must win over whatever was typed for the previous
  // one. Keyed off the incoming window and re-seeded on change, without an effect.
  const urlKey = `${from ?? ""}|${to ?? ""}`;
  const [seededFor, setSeededFor] = useState(urlKey);
  if (seededFor !== urlKey) {
    setSeededFor(urlKey);
    setFromLocal(toLocalInput(from));
    setToLocalValue(toLocalInput(to));
  }

  const effectiveFrom = toUtcIso(fromLocal);
  const effectiveTo = toUtcIso(toLocalValue);
  const hasRange = !!fromLocal || !!toLocalValue;

  // Page must reset whenever the range changes, otherwise a reader on page 3 of the full log
  // lands on an out-of-range page of a 4-row result and sees an empty table.
  //
  // Derived from the range rather than reset in an effect: an effect would render once with
  // the stale page, fire a wasted query for it, then re-render — and `react-hooks/
  // set-state-in-effect` rejects it.
  const windowKey = `${effectiveFrom ?? ""}|${effectiveTo ?? ""}`;
  const [page, setPage] = useState({ key: windowKey, number: 1 });
  const pageNumber = page.key === windowKey ? page.number : 1;
  const setPageNumber = (n: number) => setPage({ key: windowKey, number: n });

  const { data, isLoading } = useAmbientHistory({
    siteId,
    from: effectiveFrom,
    to: effectiveTo,
    pageNumber,
    pageSize,
  });
  // Same config the "Alert threshold" drawer edits — rows are graded by the limits actually in
  // force for this site, not by hardcoded numbers.
  const { data: threshold } = useAmbientThresholdBySite(siteId);
  const items = data?.items ?? [];

  return (
    <div>
      <div className="pb-3 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-medium">Environmental data history</h2>

        {/* Range controls sit on the heading row, matching Sensor history. */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            From
            <DateTimePicker
              value={fromLocal}
              onChange={setFromLocal}
              max={toLocalValue ? new Date(toLocalValue) : new Date()}
              className="h-8 w-44"
            />
          </label>
          <label className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            To
            <DateTimePicker
              value={toLocalValue}
              onChange={setToLocalValue}
              min={fromLocal ? new Date(fromLocal) : undefined}
              max={new Date()}
              className="h-8 w-44"
            />
          </label>
          {hasRange ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromLocal("");
                setToLocalValue("");
                // Drop the URL window too — leaving it would re-seed the pickers on the next
                // incoming render and silently undo the clear.
                onClearWindow?.();
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
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
                <TableHead>Gas</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>{TABLE_COLUMNS.source}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r, index) => {
                const ev = evaluateAmbientRow(r, threshold);
                return (
                  <TableRow key={r.time}>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDateTime(r.time)}
                    </TableCell>
                    <TableCell
                      className={ambientLevelTextClass(ev.temperature)}
                    >
                      {fmt(r.ambientTemperature, " °C")}
                    </TableCell>
                    <TableCell className={ambientLevelTextClass(ev.gas)}>
                      {fmt(r.gasConcentration, " %")}
                    </TableCell>
                    <TableCell className={ambientLevelTextClass(ev.water)}>
                      {fmtWater(r.waterLeakDetected)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {SOURCE_LABELS[r.source] ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
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
