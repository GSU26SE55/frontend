import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { ReportTable, type ReportColumn } from "./ReportTable";
import { ReportTimeSeriesChart } from "./ReportTimeSeriesChart";
import { ReportExportMenu } from "./ReportExportMenu";
import {
  useAlertVolume,
  useAmbientTrend,
  useAssetLifecycle,
  useBatteryHealthByType,
  useEnvironmentalIncidentsReport,
  useTopAnomalies,
  useWarrantyExpiring,
} from "@/shared/hooks/dashboard/useReports";
import type {
  AnalyticsFilter,
  AssetLifecycleRow,
  BatteryHealthByTypeRow,
  EnvironmentalIncidentRow,
  TopAnomalyRow,
  WarrantyExpiringRow,
} from "@/shared/types/dashboard/analytics.types";

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : v;

const fmtDate = (v: string | null) => {
  if (!v) return "—";
  try {
    return format(parseISO(v), "dd/MM/yyyy");
  } catch {
    return v;
  }
};

const TAB = {
  health: "health",
  alertVolume: "alert-volume",
  anomalies: "top-anomalies",
  lifecycle: "lifecycle",
  warranty: "warranty",
  env: "env",
  ambient: "ambient",
} as const;

// Header mỗi tab: tiêu đề + nút Export.
function TabHeader({
  title,
  endpoint,
  filename,
  params,
  exportDisabled,
}: {
  title: string;
  endpoint: string;
  filename: string;
  params?: Record<string, unknown>;
  exportDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ReportExportMenu
        endpoint={endpoint}
        filename={filename}
        params={params}
        disabled={exportDisabled}
      />
    </div>
  );
}

// 7 reports dạng tabs. Mỗi tab lazy-load (enabled khi active) để không bắn 7 API cùng lúc.
export function ReportTabs({ filter }: { filter: AnalyticsFilter }) {
  const [active, setActive] = useState<string>(TAB.health);

  // Params dẫn xuất từ filter chung.
  const tsParams = {
    from: filter.from,
    to: filter.to,
    granularity: filter.granularity,
  };
  const anomalyParams = { from: filter.from, to: filter.to };
  const envParams = {
    siteId: filter.siteId,
    from: filter.from,
    to: filter.to,
  };
  const ambientParams = { siteId: filter.siteId, ...tsParams };
  const ambientReady = active === TAB.ambient && !!filter.siteId;

  const healthQ = useBatteryHealthByType(active === TAB.health);
  const alertVolQ = useAlertVolume(tsParams, active === TAB.alertVolume);
  const anomaliesQ = useTopAnomalies(anomalyParams, active === TAB.anomalies);
  const lifecycleQ = useAssetLifecycle(active === TAB.lifecycle);
  const warrantyQ = useWarrantyExpiring(undefined, active === TAB.warranty);
  const envQ = useEnvironmentalIncidentsReport(envParams, active === TAB.env);
  const ambientQ = useAmbientTrend(ambientParams, ambientReady);

  const healthCols: ReportColumn<BatteryHealthByTypeRow>[] = [
    {
      key: "name",
      header: "Loại pin",
      align: "left",
      render: (r) => dash(r.name),
    },
    {
      key: "total",
      header: "Tổng asset",
      align: "right",
      render: (r) => r.totalAssets,
    },
    {
      key: "alerts",
      header: "Có cảnh báo",
      align: "right",
      render: (r) => r.withActiveAlerts,
    },
    {
      key: "health",
      header: "Health score",
      align: "right",
      render: (r) => `${r.healthScore}%`,
    },
  ];

  const anomalyCols: ReportColumn<TopAnomalyRow>[] = [
    {
      key: "type",
      header: "Loại anomaly",
      align: "left",
      render: (r) => r.anomalyType,
    },
    {
      key: "count",
      header: "Số lượng",
      align: "right",
      render: (r) => r.count,
    },
    {
      key: "critical",
      header: "Critical",
      align: "right",
      render: (r) => r.criticalCount,
    },
  ];

  const lifecycleCols: ReportColumn<AssetLifecycleRow>[] = [
    {
      key: "serial",
      header: "Serial",
      align: "left",
      render: (r) => dash(r.serialNumber),
    },
    {
      key: "age",
      header: "Tuổi (ngày)",
      align: "right",
      render: (r) => r.ageDays,
    },
    {
      key: "cycle",
      header: "Cycle count",
      align: "right",
      render: (r) => dash(r.cycleCount),
    },
    {
      key: "alerts",
      header: "Tổng cảnh báo",
      align: "right",
      render: (r) => r.alertsTotal,
    },
  ];

  const warrantyCols: ReportColumn<WarrantyExpiringRow>[] = [
    {
      key: "serial",
      header: "Serial",
      align: "left",
      render: (r) => dash(r.serialNumber),
    },
    {
      key: "end",
      header: "Hết bảo hành",
      align: "right",
      render: (r) => fmtDate(r.warrantyEndDate),
    },
    {
      key: "days",
      header: "Còn lại (ngày)",
      align: "right",
      render: (r) => dash(r.daysRemaining),
    },
    {
      key: "customer",
      header: "Khách hàng",
      align: "left",
      render: (r) => r.customerId,
    },
  ];

  const envCols: ReportColumn<EnvironmentalIncidentRow>[] = [
    {
      key: "type",
      header: "Loại sự cố",
      align: "left",
      render: (r) => r.incidentType,
    },
    {
      key: "severity",
      header: "Mức độ",
      align: "left",
      render: (r) => r.severity,
    },
    {
      key: "detected",
      header: "Phát hiện",
      align: "right",
      render: (r) => fmtDate(r.detectedAt),
    },
    {
      key: "resolved",
      header: "Xử lý xong",
      align: "right",
      render: (r) => fmtDate(r.resolvedAt),
    },
    {
      key: "duration",
      header: "Thời lượng (h)",
      align: "right",
      render: (r) => dash(r.durationHours),
    },
    {
      key: "false",
      header: "Báo động giả",
      align: "left",
      render: (r) => (r.wasFalseAlarm ? "Có" : "Không"),
    },
  ];

  return (
    <Tabs
      value={active}
      onValueChange={setActive}
      className="bg-card rounded-xl border border-border p-5 lg:p-6 shadow-xs"
    >
      <TabsList className="flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value={TAB.health}>Sức khỏe theo loại</TabsTrigger>
        <TabsTrigger value={TAB.alertVolume}>Số lượng cảnh báo</TabsTrigger>
        <TabsTrigger value={TAB.anomalies}>Top anomaly</TabsTrigger>
        <TabsTrigger value={TAB.lifecycle}>Vòng đời asset</TabsTrigger>
        <TabsTrigger value={TAB.warranty}>Sắp hết bảo hành</TabsTrigger>
        <TabsTrigger value={TAB.env}>Sự cố môi trường</TabsTrigger>
        <TabsTrigger value={TAB.ambient}>Xu hướng môi trường</TabsTrigger>
      </TabsList>

      <TabsContent value={TAB.health} className="mt-4">
        <TabHeader
          title="Sức khỏe pin theo loại"
          endpoint={ENDPOINTS.REPORTS.BATTERY_HEALTH_BY_TYPE}
          filename="battery-health-by-type"
        />
        <ReportTable
          columns={healthCols}
          rows={healthQ.data}
          isLoading={healthQ.isLoading}
          rowKey={(r) => r.typeId}
        />
      </TabsContent>

      <TabsContent value={TAB.alertVolume} className="mt-4">
        <TabHeader
          title="Số lượng cảnh báo theo thời gian"
          endpoint={ENDPOINTS.REPORTS.ALERT_VOLUME}
          filename="alert-volume"
          params={tsParams}
        />
        <ReportTimeSeriesChart
          data={alertVolQ.data}
          isLoading={alertVolQ.isLoading}
          xKey="date"
          series={[
            { key: "count", label: "Số cảnh báo", color: "var(--chart-1)" },
          ]}
        />
      </TabsContent>

      <TabsContent value={TAB.anomalies} className="mt-4">
        <TabHeader
          title="Top loại anomaly"
          endpoint={ENDPOINTS.REPORTS.TOP_ANOMALIES}
          filename="top-anomalies"
          params={anomalyParams}
        />
        <ReportTable
          columns={anomalyCols}
          rows={anomaliesQ.data}
          isLoading={anomaliesQ.isLoading}
          rowKey={(r) => r.anomalyType}
        />
      </TabsContent>

      <TabsContent value={TAB.lifecycle} className="mt-4">
        <TabHeader
          title="Vòng đời asset"
          endpoint={ENDPOINTS.REPORTS.ASSET_LIFECYCLE}
          filename="asset-lifecycle"
        />
        <ReportTable
          columns={lifecycleCols}
          rows={lifecycleQ.data}
          isLoading={lifecycleQ.isLoading}
          rowKey={(r) => r.assetId}
        />
      </TabsContent>

      <TabsContent value={TAB.warranty} className="mt-4">
        <TabHeader
          title="Asset sắp hết bảo hành"
          endpoint={ENDPOINTS.REPORTS.WARRANTY_EXPIRING}
          filename="warranty-expiring"
        />
        <ReportTable
          columns={warrantyCols}
          rows={warrantyQ.data}
          isLoading={warrantyQ.isLoading}
          rowKey={(r) => r.assetId}
        />
      </TabsContent>

      <TabsContent value={TAB.env} className="mt-4">
        <TabHeader
          title="Sự cố môi trường"
          endpoint={ENDPOINTS.REPORTS.ENVIRONMENTAL_INCIDENTS}
          filename="environmental-incidents"
          params={envParams}
        />
        <ReportTable
          columns={envCols}
          rows={envQ.data}
          isLoading={envQ.isLoading}
          rowKey={(r, i) => `${r.siteId}-${r.detectedAt}-${i}`}
        />
      </TabsContent>

      <TabsContent value={TAB.ambient} className="mt-4">
        <TabHeader
          title="Xu hướng môi trường theo site"
          endpoint={ENDPOINTS.REPORTS.AMBIENT_TREND}
          filename="ambient-trend"
          params={ambientParams}
          exportDisabled={!filter.siteId}
        />
        {!filter.siteId ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            Chọn 1 site ở filter để xem xu hướng môi trường.
          </p>
        ) : (
          <ReportTimeSeriesChart
            data={ambientQ.data}
            isLoading={ambientQ.isLoading}
            xKey="date"
            series={[
              { key: "avgTemp", label: "TB (°C)", color: "var(--chart-2)" },
              { key: "maxTemp", label: "Max (°C)", color: "var(--p1)" },
              { key: "minTemp", label: "Min (°C)", color: "var(--chart-4)" },
              {
                key: "humidityAvg",
                label: "Độ ẩm (%)",
                color: "var(--chart-3)",
                connectNulls: true,
              },
              {
                key: "irradianceAvg",
                label: "Bức xạ",
                color: "var(--chart-5)",
                connectNulls: true,
              },
            ]}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
