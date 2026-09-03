import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Battery, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BatteryMaintenanceHistory from "@/shared/components/battery/BatteryMaintenanceHistory";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import { useBatteryAssetRealtime } from "@/shared/hooks/battery/useBatteryAssetRealtime";
import SensorChart from "@/shared/components/battery/SensorChart";
import ChargeDischargePeakChart from "@/shared/components/battery/ChargeDischargePeakChart";
import SensorHistoryTable from "@/shared/components/battery/SensorHistoryTable";
// Ẩn cùng tab "AI prediction" (xem TabsTrigger/TabsContent bên dưới). Comment thay vì xoá
// để bật lại chỉ bằng bỏ ba khối comment, không phải tìm lại đường import.
// import AiPredictionCard from "@/shared/components/battery/AiPredictionCard";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { LiveTelemetryCard } from "@/shared/components/dashboard/LiveTelemetryCard";
import { useSensorStream } from "@/shared/hooks/ticket/useSensorStream";
import { useIotDevicesForStaff } from "@/shared/hooks/iot/useIotDeviceRead";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";
import { KEY } from "@/shared/utils/queryKeys";
import {
  healthScoreTone,
  toneClass,
  toneVars,
} from "@/shared/theme/statusColors";
import { formatDate, formatDateTime } from "@/shared/utils/datetime";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right truncate max-w-35">
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
      <div className="px-4 pt-3 pb-2.5 flex items-center gap-2 text-muted-foreground">
        <HeartPulse size={16} />
        <span className="text-xs">Max capacity not available yet</span>
      </div>
    );
  }
  const tone = healthScoreTone(sohPercent);
  const { fg, bg } = toneVars(tone);
  // The tone fills the whole slot rather than sitting in an inset card: this is the first
  // band of the sidebar and reads as a status banner, so an outline + surrounding gutter
  // only boxed the colour in and competed with the panel's own border.
  return (
    <div
      className="px-4 py-3.5 flex items-center gap-3 transition-[color,background-color] duration-(--motion-enter) ease-strong"
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-sm font-semibold flex-1 min-w-0 truncate"
        style={{ color: fg }}
      >
        Max capacity
      </span>
      <span
        className="text-3xl font-black tracking-tight tabular-nums leading-none"
        style={{ color: fg }}
      >
        {sohPercent.toFixed(0)}
        <span className="text-base font-bold ml-0.5">%</span>
      </span>
    </div>
  );
}

interface BatteryRealtimeDetailProps {
  assetId: string;
  // Admin injects CRUD buttons (Edit/Transfer/Delete) + dialogs through this slot;
  // Admin and Staff also pass the BMS control here. Manager leaves it empty.
  headerActions?: ReactNode;
}

// Whitelist — an unknown ?tab= falls back to Chart. Every TabsTrigger value must be
// listed here: because the tab is controlled from the URL, a missing entry makes the
// trigger snap straight back to Chart instead of opening.
const TAB_VALUES = ["chart", "peak", "history", "maintenance"] as const;
type TabValue = (typeof TAB_VALUES)[number];

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
  const tab = TAB_VALUES.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : "chart";
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
  // Whichever of SSE (stream.reading, ~5s) or polling (rt, 30s) has the NEWER `time` wins —
  // comparing timestamps instead of always preferring SSE. A pure SSE-first pick got stuck on
  // a stale reading whenever the gateway went offline (SSE stops pushing but keeps its last
  // value in state): the header Refresh button re-triggers `rt`'s query, yet the screen never
  // reflected it because the stale SSE value kept winning the `??` fallback regardless of age.
  const live =
    !stream.reading || (rt?.time && rt.time > stream.reading.time)
      ? (rt ?? stream.reading ?? null)
      : stream.reading;
  // Telemetry alert threshold by BatteryType — readable by Admin/Manager/Staff alike.
  const { data: threshold } = useThresholdByType(asset?.batteryTypeId ?? "");

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-6 h-[calc(100vh-65px)] pl-(--page-pl) pr-(--page-pr)">
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

  const gatewayItems = gateways?.items ?? [];
  const gatewayOnline = gatewayItems.some(
    (device) => device.status === IotDeviceStatusEnum.Active,
  );
  const gatewayConnecting = gatewayItems.some(
    (device) => device.status === IotDeviceStatusEnum.Pending,
  );
  // toneClass, not fixed emerald-50/zinc-100 pairs: those render dark text on a light chip and
  // do not invert, so every gateway badge stayed a bright block on the dark shell.
  const gatewayBadge = !gateways
    ? { label: "Checking gateway", className: toneClass("muted") }
    : gatewayOnline
      ? { label: "Gateway online", className: toneClass("ok") }
      : gatewayConnecting
        ? { label: "Gateway connecting", className: toneClass("p3") }
        : gatewayItems.length > 0
          ? { label: "Gateway offline", className: toneClass("p1") }
          : { label: "No gateway", className: toneClass("muted") };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="py-3 flex items-center justify-between gap-4 shrink-0 pl-(--page-pl) pr-(--page-pr)">
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
                  "inline-flex items-center text-2xs font-semibold px-2 py-0.5 rounded-full border",
                  gatewayBadge.className,
                )}
                title="Live connection status of the IoT gateway at this site"
              >
                {gatewayBadge.label}
              </span>
              {/* Cascade risk badge hidden on FE. */}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {asset.batteryTypeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerActions}
          {/* Nút này phải làm mới CẢ TRANG, không chỉ thông tin pin. Trước đây nó chỉ invalidate
              `batteryAssets`, nên bấm xong thì chart, ngưỡng, thiết bị gateway và trạng thái BMS
              vẫn là dữ liệu cũ — người dùng thấy nút quay mà nửa màn hình không đổi.
              `sensorReadings` phủ chart + bảng lịch sử; `thresholds` phủ màu cảnh báo và các vùng
              tô trên chart; `iotDevices` phủ badge gateway online/offline. */}
          <RefreshButton
            queryKeys={[
              KEY.batteryAssets,
              KEY.sensorReadings,
              KEY.thresholds,
              KEY.iotDevices,
              KEY.alerts,
            ]}
          />
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
              <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Information
              </p>
              <div className="divide-y divide-border/50">
                <InfoRow label="Customer" value={asset.customerName} />
                <InfoRow label="Site" value={asset.siteName} />
                <InfoRow
                  label="Install date"
                  value={
                    asset.installDate ? formatDate(asset.installDate) : null
                  }
                />
                <InfoRow
                  label="Warranty end"
                  value={
                    asset.warrantyEndDate
                      ? formatDate(asset.warrantyEndDate)
                      : null
                  }
                />
                <InfoRow
                  label="Last reading"
                  value={
                    asset.lastSensorReadingAt
                      ? formatDateTime(asset.lastSensorReadingAt)
                      : null
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Realtime — live SSE (~5s), seed/fallback from rt (polling 30s) */}
            <LiveTelemetryCard
              data={live}
              stats={stream.stats?.["1h"]}
              thresholds={
                threshold
                  ? {
                      socWarning: threshold.socWarningThreshold,
                      socCritical: threshold.socCriticalThreshold,
                      temperatureMin: threshold.temperatureMin,
                      temperatureMax: threshold.temperatureMax,
                      voltageMin: threshold.voltageMin,
                      voltageMax: threshold.voltageMax,
                      currentMaxCharge: threshold.currentMaxCharge,
                      currentMaxDischarge: threshold.currentMaxDischarge,
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
                  <TabsTrigger value="maintenance">
                    Maintenance history
                  </TabsTrigger>
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
              <TabsContent
                value="maintenance"
                className="min-h-0 overflow-y-auto m-0 p-5"
              >
                <BatteryMaintenanceHistory assetId={id} />
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
