import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Battery } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import { useBatteryAssetRealtime } from "@/shared/hooks/battery/useBatteryAssetRealtime";
import SensorChart from "@/shared/components/battery/SensorChart";
import ChargeDischargePeakChart from "@/shared/components/battery/ChargeDischargePeakChart";
import SensorHistoryTable from "@/shared/components/battery/SensorHistoryTable";
import CascadeRiskCard from "@/shared/components/battery/CascadeRiskCard";
import AiPredictionCard from "@/shared/components/battery/AiPredictionCard";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import type { ElectricalTopologyName } from "@/shared/types/battery/cascade.types";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { LiveTelemetryCard } from "@/shared/components/dashboard/LiveTelemetryCard";
import { useSensorStream } from "@/shared/hooks/ticket/useSensorStream";
import { KEY } from "@/shared/utils/queryKeys";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BatteryStatusEnum,
  { label: string; dot: string; badge: string }
> = {
  [BatteryStatusEnum.Active]: {
    label: "Hoạt động",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [BatteryStatusEnum.Inactive]: {
    label: "Không hoạt động",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
  [BatteryStatusEnum.Decommissioned]: {
    label: "Ngừng sử dụng",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 border-red-200",
  },
};

const fmtDate = (s: string) =>
  format(new Date(s), "dd/MM/yyyy", { locale: vi });

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right leading-relaxed">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

interface BatteryRealtimeDetailProps {
  assetId: string;
  // Admin bơm nút CRUD (Sửa/Transfer/Xóa) + dialog qua slot này. Manager/Staff bỏ trống.
  headerActions?: ReactNode;
  // Admin bơm SetTopologyDialog + nút mở qua slot này (POST /topology chỉ Admin).
  topologyAction?: (ctx: {
    currentTopology?: ElectricalTopologyName;
    isLoading: boolean;
  }) => ReactNode;
}

// Trang chi tiết real-time battery (read-only core) — dùng chung admin/manager/staff.
// CRUD/topology chỉ Admin, bơm qua slot headerActions/topologyAction.
export default function BatteryRealtimeDetail({
  assetId: id,
  headerActions,
  topologyAction,
}: BatteryRealtimeDetailProps) {
  const navigate = useNavigate();

  const { data: asset, isLoading } = useBatteryAsset(id);
  const { data: rt } = useBatteryAssetRealtime(id);
  const stream = useSensorStream(id ? `asset:${id}` : null);
  // Ưu tiên live SSE; fallback seed/polling = rt (useBatteryAssetRealtime).
  const live = stream.reading ?? rt ?? null;
  // Ngưỡng cảnh báo telemetry theo BatteryType — Admin/Manager/Staff đều đọc được.
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
        <span className="text-sm">Không tìm thấy battery asset.</span>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Quay lại
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[asset.status];

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
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
              >
                <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>
              {rt && rt.activeAlerts > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                  {rt.activeAlerts} cảnh báo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {asset.batteryTypeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RefreshButton queryKeys={[KEY.batteryAssets]} size="icon" />
          {headerActions}
        </div>
      </div>

      {/* ── Main panel ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="flex h-full border border-border rounded-xl overflow-hidden bg-card">
          {/* Left sidebar */}
          <div className="w-65 shrink-0 border-r border-border flex flex-col overflow-y-auto">
            {/* Info */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Thông tin
              </p>
              <div className="divide-y divide-border/50">
                <InfoRow label="Khách hàng" value={asset.customerName} />
                <InfoRow label="Site" value={asset.siteName} />
                <InfoRow
                  label="Ngày lắp đặt"
                  value={asset.installDate ? fmtDate(asset.installDate) : null}
                />
                <InfoRow
                  label="Hết bảo hành"
                  value={
                    asset.warrantyEndDate
                      ? fmtDate(asset.warrantyEndDate)
                      : null
                  }
                />
                <InfoRow
                  label="Đọc cuối"
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

            {/* Realtime — live SSE (~5s), seed/fallback từ rt (polling 30s) */}
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
            <Tabs defaultValue="chart" className="h-full gap-0">
              <div className="px-5 py-3 border-b border-border shrink-0">
                <TabsList>
                  <TabsTrigger value="chart">Biểu đồ</TabsTrigger>
                  <TabsTrigger value="peak">Nạp/Xả đỉnh</TabsTrigger>
                  <TabsTrigger value="history">Lịch sử cảm biến</TabsTrigger>
                  <TabsTrigger value="cascade">Rủi ro lan truyền</TabsTrigger>
                  <TabsTrigger value="ai">AI dự đoán</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent
                value="chart"
                className="flex-1 min-h-0 overflow-hidden m-0 h-full"
              >
                <SensorChart
                  assetId={id}
                  batteryTypeId={asset?.batteryTypeId}
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
                />
              </TabsContent>
              <TabsContent
                value="history"
                className="flex-1 min-h-0 overflow-hidden m-0 h-full"
              >
                <SensorHistoryTable
                  assetId={id}
                  batteryTypeId={asset?.batteryTypeId}
                  fillHeight
                />
              </TabsContent>
              <TabsContent
                value="cascade"
                className="min-h-0 overflow-y-auto m-0 p-5"
              >
                <CascadeRiskCard assetId={id} topologyAction={topologyAction} />
              </TabsContent>
              <TabsContent
                value="ai"
                className="min-h-0 overflow-y-auto m-0 p-5"
              >
                <AiPredictionCard assetId={id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
