import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Thermometer, Droplets, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import DataPagination from "@/shared/components/common/DataPagination";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  useAmbientThresholdBySite,
  useAmbientLatest,
  useAmbientHistory,
  useUpsertAmbientThreshold,
} from "@/shared/hooks/useAmbient";
import {
  ambientThresholdSchema,
  type AmbientThresholdFormValues,
} from "@/shared/schemas/ambient.schema";
import { AmbientReadingSourceEnum } from "@/shared/enums/ambient.enum";
import type { AmbientThresholdUpsertPayload } from "@/shared/types/ambient.types";
import type { SiteOption } from "@/shared/types/site.types";

const SOURCE_LABELS: Record<AmbientReadingSourceEnum, string> = {
  [AmbientReadingSourceEnum.IotSensor]: "Cảm biến IoT",
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

export default function AmbientConfigView({
  subtitle,
  sites,
}: {
  subtitle: string;
  sites: SiteOption[];
}) {
  const [siteId, setSiteId] = useState("");

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          {subtitle}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Môi trường site
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cấu hình ngưỡng cảnh báo & xem dữ liệu môi trường theo site
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Site</Label>
        <Select
          value={siteId || null}
          items={sites.map((s) => ({ value: s.id, label: s.name }))}
          onValueChange={(v: string | null) => setSiteId(v ?? "")}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Chọn site..." />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!siteId ? (
        <Card className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-sm">Chọn một site để xem cấu hình.</span>
        </Card>
      ) : (
        <div className="space-y-6">
          <LatestWidget siteId={siteId} />
          <ThresholdForm siteId={siteId} />
          <HistoryTable siteId={siteId} />
        </div>
      )}
    </div>
  );
}

// ── Latest reading widget ───────────────────────────────────────────────────
function LatestWidget({ siteId }: { siteId: string }) {
  const { data: latest, isLoading, isError } = useAmbientLatest(siteId);

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (isError || !latest) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Chưa có dữ liệu môi trường cho site này.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        icon={<Thermometer className="size-5 text-orange-500" />}
        label="Nhiệt độ"
        value={fmt(latest.ambientTemperature, " °C")}
      />
      <MetricCard
        icon={<Droplets className="size-5 text-blue-500" />}
        label="Độ ẩm"
        value={fmt(latest.humidity, " %")}
      />
      <MetricCard
        icon={<Sun className="size-5 text-amber-500" />}
        label="Bức xạ"
        value={fmt(latest.solarIrradiance, " W/m²")}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </Card>
  );
}

// ── Threshold config form ───────────────────────────────────────────────────
function ThresholdForm({ siteId }: { siteId: string }) {
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
      // 404 — site chưa cấu hình → form tạo mới
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
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold mb-4">
        Ngưỡng cảnh báo môi trường
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("siteId")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumField
            label="Nhiệt độ — cảnh báo (°C)"
            error={errors.highAmbientTempWarning?.message}
            {...register("highAmbientTempWarning")}
          />
          <NumField
            label="Nhiệt độ — nguy hiểm (°C)"
            error={errors.highAmbientTempCritical?.message}
            {...register("highAmbientTempCritical")}
          />
          <NumField
            label="Độ ẩm — cảnh báo (%)"
            error={errors.highHumidityWarning?.message}
            {...register("highHumidityWarning")}
          />
          <NumField
            label="Độ ẩm — nguy hiểm (%)"
            error={errors.highHumidityCritical?.message}
            {...register("highHumidityCritical")}
          />
          <NumField
            label="Combo — ngưỡng nhiệt (°C)"
            error={errors.comboTempThreshold?.message}
            {...register("comboTempThreshold")}
          />
          <NumField
            label="Combo — ngưỡng ẩm (%)"
            error={errors.comboHumidityThreshold?.message}
            {...register("comboHumidityThreshold")}
          />
        </div>

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
            Bật giám sát ngưỡng
          </Label>
        </div>

        <p className="text-xs text-muted-foreground">
          Bỏ trống một trường = không giám sát metric đó. Combo rule chỉ active
          khi cả 2 ngưỡng combo có giá trị.
        </p>

        <Button type="submit" disabled={isSubmitting}>
          Lưu cấu hình
        </Button>
      </form>
    </Card>
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
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input type="number" step="any" {...rest} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ── History table ───────────────────────────────────────────────────────────
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
    <Card className="gap-0 py-0 overflow-hidden">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-semibold">Lịch sử dữ liệu môi trường</h2>
      </div>
      {isLoading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu môi trường.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời điểm</TableHead>
              <TableHead>Nhiệt độ</TableHead>
              <TableHead>Độ ẩm</TableHead>
              <TableHead>Bức xạ</TableHead>
              <TableHead>Nguồn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.time}>
                <TableCell className="text-sm text-muted-foreground">
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

      <div className="p-3">
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
    </Card>
  );
}
