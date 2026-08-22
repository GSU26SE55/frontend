import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Battery,
  BatteryFull,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import { useBatteryAssetRealtime } from "@/shared/hooks/battery/useBatteryAssetRealtime";
import { useCascadeRisk } from "@/shared/hooks/battery/useCascadeRisk";
import SensorChart from "@/shared/components/battery/SensorChart";
import ChargeDischargePeakChart from "@/shared/components/battery/ChargeDischargePeakChart";
import SensorHistoryTable from "@/shared/components/battery/SensorHistoryTable";
// Ẩn cùng tab "AI prediction" (xem TabsTrigger/TabsContent bên dưới). Comment thay vì xoá
// để bật lại chỉ bằng bỏ ba khối comment, không phải tìm lại đường import.
// import AiPredictionCard from "@/shared/components/battery/AiPredictionCard";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { LiveTelemetryCard } from "@/shared/components/dashboard/LiveTelemetryCard";
import { useSensorStream } from "@/shared/hooks/ticket/useSensorStream";
import { useIotDevicesForStaff } from "@/shared/hooks/iot/useIotDeviceRead";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";
import { KEY } from "@/shared/utils/queryKeys";
import {
  healthScoreTone,
  toneVars,
  CASCADE_RISK_TONE,
} from "@/shared/theme/statusColors";

// ── Config ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BatteryStatusEnum,
  { label: string; dot: string; badge: string }
> = {
  [BatteryStatusEnum.Active]: {
    label: "Active",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [BatteryStatusEnum.Inactive]: {
    label: "Inactive",
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  [BatteryStatusEnum.Decommissioned]: {
    label: "Decommissioned",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy", { locale: enUS });
  } catch {
    return iso;
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right truncate max-w-[140px]">
        {value || "—"}
      </span>
    </div>
  );
}

// The percentage a battery can still hold relative to its nominal capacity — labelled
// "Max capacity" for operators, but it IS the SOH the AI module predicts. It gets top
// billing above Information instead of being buried as one more stat tile among
// Voltage/Current/Temperature/SOC.
function MaxCapacityHighlight({ sohPercent }: { sohPercent?: number | null }) {
  if (sohPercent == null) {
    return (
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 text-muted-foreground">
        <HeartPulse size={16} />
        <span className="text-xs">Max capacity not available yet</span>
      </div>
    );
  }
  const tone = healthScoreTone(sohPercent);
  const { fg, bg } = toneVars(tone);
  return (
    <div className="px-4 pt-4 pb-3">
      <div
        className="rounded-xl p-3.5 flex items-center gap-3.5 border transition-all"
        style={{
          backgroundColor: bg,
          borderColor: `${fg}35`,
        }}
      >
        <div
          className="size-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: fg }}
        >
          <BatteryFull size={19} className="text-white" strokeWidth={2.3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1 leading-none mb-1">
            <span
              className="text-2xl font-black tracking-tight tabular-nums"
              style={{ color: fg }}
            >
              {sohPercent.toFixed(0)}
            </span>
            <span className="text-xs font-bold" style={{ color: fg }}>
              %
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Max capacity
          </span>
        </div>
      </div>
    </div>
  );
}

// Cascade risk is a critical safety signal — kept as a header badge (next to
// Active/alerts) so it can't be missed by scrolling past a sidebar card.
function CascadeRiskBadge({ assetId }: { assetId: string }) {
  const { data } = useCascadeRisk(assetId);
  if (!data) return null;
  const tone = CASCADE_RISK_TONE[data.level] ?? "muted";
  const { fg, bg } = toneVars(tone);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: fg, backgroundColor: bg, borderColor: fg }}
      title={`Cascade risk score ${data.cascadeRiskScore.toFixed(2)}`}
    >
      <ShieldAlert size={12} />
      Cascade risk: {data.level}
    </span>
  );
}

interface BatteryRealtimeDetailProps {
  assetId: string;
  // Admin injects CRUD buttons (Edit/Transfer/Delete) + dialogs through this slot;
  // Admin and Staff also pass the BMS control here. Manager leaves it empty.
  headerActions?: ReactNode;
}

// Real-time battery detail page (read-only core) — shared by admin/manager/staff.
// CRUD/topology is Admin-only, injected through the headerActions slot.
export default function BatteryRealtimeDetail({
  assetId: id,
  headerActions,
}: BatteryRealtimeDetailProps) {
  const navigate = useNavigate();

  // Tab + range live in the URL so a ticket can link straight to
  // "?tab=history&from=…&to=…" and land on Sensor history already filtered to the ±2' window
  // around detection. With an uncontrolled <Tabs defaultValue> that link always opened Chart.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab =
    tabParam === "history" || tabParam === "peak" ? tabParam : "chart";
  const rangeFrom = searchParams.get("from") ?? undefined;
  const rangeTo = searchParams.get("to") ?? undefined;

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  // Dropping the range keeps the reader on the current tab and restores the default view.
  const clearRange = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("from");
    next.delete("to");
    setSearchParams(next, { replace: true });
  };

  const { data: asset, isLoading } = useBatteryAsset(id);
  const { data: rt } = useBatteryAssetRealtime(id);
  const { data: gateways } = useIotDevicesForStaff(
    {
      siteId: asset?.siteId ?? undefined,
      pageNumber: 1,
      pageSize: 100,
    },
    !!asset?.siteId,
  );
  const stream = useSensorStream(id ? `asset:${id}` : null);
  // Prefer live SSE; fallback seed/polling = rt (useBatteryAssetRealtime).
  const live = stream.reading ?? rt ?? null;
  // Telemetry alert threshold by BatteryType — readable by Admin/Manager/Staff alike.
  const { data: threshold } = useThresholdByType(asset?.batteryTypeId ?? "");

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 h-[calc(100vh-65px)]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    );
  }

  // Not found
  if (!asset) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-muted-foreground pt-20">
        <Battery className="size-8 opacity-30" />
        <span className="text-sm">Battery asset not found.</span>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[asset.status];
  const gatewayItems = gateways?.items ?? [];
  const gatewayOnline = gatewayItems.some(
    (device) => device.status === IotDeviceStatusEnum.Active,
  );
  const gatewayConnecting = gatewayItems.some(
    (device) => device.status === IotDeviceStatusEnum.Pending,
  );
  const gatewayBadge = !gateways
    ? {
        label: "Checking gateway",
        className: "bg-zinc-100 text-zinc-600 border-zinc-200",
      }
    : gatewayOnline
      ? {
          label: "Gateway online",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        }
      : gatewayConnecting
        ? {
            label: "Gateway connecting",
            className: "bg-amber-50 text-amber-700 border-amber-200",
          }
        : gatewayItems.length > 0
          ? {
              label: "Gateway offline",
              className: "bg-red-50 text-red-700 border-red-200",
            }
          : {
              label: "No gateway",
              className: "bg-zinc-100 text-zinc-600 border-zinc-200",
            };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold font-mono tracking-tight leading-none">
                {asset.serialNumber}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                  statusCfg.badge,
                )}
                title="Battery lifecycle status configured by an administrator"
              >
                <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                Lifecycle: {statusCfg.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                  gatewayBadge.className,
                )}
                title="Live connection status of the IoT gateway at this site"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    gatewayOnline
                      ? "bg-emerald-500"
                      : gatewayConnecting
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                />
                {gatewayBadge.label}
              </span>
              {rt && rt.activeAlerts > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                  {rt.activeAlerts} alerts
                </span>
              )}
              <CascadeRiskBadge assetId={id} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {asset.batteryTypeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RefreshButton queryKeys={[KEY.batteryAssets]} />
          {headerActions}
        </div>
      </div>

      {/* ── Main panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="flex h-full border border-border rounded-xl overflow-hidden bg-card">
          {/* Left sidebar */}
          <div className="w-65 shrink-0 border-r border-border flex flex-col overflow-y-auto">
            {/* SOH — the single most important health indicator, shown first and prominently */}
            <MaxCapacityHighlight sohPercent={live?.sohPercent} />

            <Separator />

            {/* Info */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Information
              </p>
              <div className="divide-y divide-border/50">
                <InfoRow label="Customer" value={asset.customerName} />
                <InfoRow label="Site" value={asset.siteName} />
                <InfoRow
                  label="Install date"
                  value={asset.installDate ? fmtDate(asset.installDate) : null}
                />
                <InfoRow
                  label="Warranty end"
                  value={
                    asset.warrantyEndDate
                      ? fmtDate(asset.warrantyEndDate)
                      : null
                  }
                />
                <InfoRow
                  label="Last reading"
                  value={
                    asset.lastSensorReadingAt
                      ? new Date(asset.lastSensorReadingAt).toLocaleString(
                          "vi-VN",
                        )
                      : null
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Realtime — live SSE (~5s), seed/fallback from rt (polling 30s) */}
            <LiveTelemetryCard
              data={live}
              status={stream.status}
              stats={stream.stats?.["1h"]}
              thresholds={
                threshold
                  ? {
                      socWarning: threshold.socWarningThreshold,
                      socCritical: threshold.socCriticalThreshold,
                      temperatureMax: threshold.temperatureMax,
                    }
                  : undefined
              }
            />
          </div>

          {/* Right: chart / history tabs */}
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs value={tab} onValueChange={setTab} className="h-full gap-0">
              <div className="px-5 py-3 border-b border-border shrink-0">
                <TabsList>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="peak">Charge/discharge peak</TabsTrigger>
                  <TabsTrigger value="history">Sensor history</TabsTrigger>
                  {/* Tab "AI prediction" tạm ẩn theo yêu cầu — chưa cần cho luồng hiện tại.
                      Giữ nguyên component + TabsContent bên dưới (cũng đã ẩn) để bật lại chỉ
                      bằng cách bỏ hai khối comment này, không phải dựng lại từ đầu. */}
                </TabsList>
              </div>
              <TabsContent
                value="chart"
                className="flex-1 min-h-0 overflow-hidden m-0 h-full"
              >
                <SensorChart
                  assetId={id}
                  batteryTypeId={asset?.batteryTypeId}
                  from={rangeFrom}
                  to={rangeTo}
                  onClearRange={rangeFrom || rangeTo ? clearRange : undefined}
                  fillHeight
                />
              </TabsContent>
              <TabsContent
                value="peak"
                className="min-h-0 overflow-y-auto m-0 p-5"
              >
                <ChargeDischargePeakChart
                  assetId={id}
                  batteryTypeId={asset?.batteryTypeId}
                  from={rangeFrom}
                  to={rangeTo}
                  onClearRange={rangeFrom || rangeTo ? clearRange : undefined}
                />
              </TabsContent>
              <TabsContent
                value="history"
                className="flex-1 min-h-0 overflow-hidden m-0 h-full"
              >
                <SensorHistoryTable
                  assetId={id}
                  batteryTypeId={asset?.batteryTypeId}
                  from={rangeFrom}
                  to={rangeTo}
                  onClearRange={rangeFrom || rangeTo ? clearRange : undefined}
                  fillHeight
                />
              </TabsContent>
              {/* Ẩn cùng TabsTrigger "ai" ở trên — xem ghi chú tại đó. */}
              {/* <TabsContent
                value="ai"
                className="min-h-0 overflow-y-auto m-0 p-5"
              >
                <AiPredictionCard assetId={id} />
              </TabsContent> */}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
