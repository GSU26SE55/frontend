import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import {
  useIotDeviceHeartbeats,
  useIotDevicesForStaff,
} from "@/shared/hooks/iot/useIotDeviceRead";
import {
  CLOCK_SKEW_REJECT_SECONDS,
  WEAK_RSSI_DBM,
  clockSkewTone,
  formatRelativeTime,
  formatUptime,
  rssiTone,
  toneTextClass,
} from "@/shared/utils/iotDeviceHealth";

/**
 * IOT3-67 — chi tiết thiết bị + biểu đồ heartbeat.
 *
 * Bốn chuỗi số trong heartbeat trả lời gần hết các câu hỏi hiện trường mà không cần tháo tủ:
 *   • RSSI tụt dần        → ăng-ten bị che, cần đổi chỗ
 *   • RAM tụt dần         → rò bộ nhớ trong firmware
 *   • hàng đợi phình lên  → thiết bị lấy mẫu được nhưng KHÔNG ra được backend
 *   • uptime tụt về 0     → thiết bị đang khởi động lại vòng vòng
 *
 * Vẽ chúng cạnh nhau quan trọng hơn từng cái riêng lẻ: "RAM tụt CÙNG LÚC uptime reset" là rò
 * bộ nhớ, còn "hàng đợi phình mà RSSI vẫn tốt" lại là vấn đề phía backend.
 */

/** Recharts cần trục thời gian TĂNG DẦN; API trả mới-trước. */
function toChartRows(
  items: {
    time: string;
    rssiDbm: number | null;
    freeMemoryPercent: number | null;
    uptimeSeconds: number | null;
    queuedReadingCount: number | null;
  }[],
) {
  const asc = [...items].reverse();

  // Độ chi tiết của nhãn phải theo KHOẢNG THỜI GIAN thật sự đang xem, không cố định `HH:mm`.
  // Thiết bị mới lắp gửi vài nhịp trong cùng một phút ⇒ cả trục X ra một giá trị giống hệt nhau
  // và biểu đồ mất hẳn ý nghĩa — đúng lúc người ta cần nó nhất.
  const first = asc.length > 0 ? new Date(asc[0].time).getTime() : 0;
  const last =
    asc.length > 0 ? new Date(asc[asc.length - 1].time).getTime() : 0;
  const spanMs = Math.max(0, last - first);

  const labelFormat: Intl.DateTimeFormatOptions =
    spanMs < 60 * 60 * 1000
      ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } // dưới 1 giờ → cần tới giây
      : spanMs < 24 * 60 * 60 * 1000
        ? { hour: "2-digit", minute: "2-digit" }
        : {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          };

  return asc.map((h) => ({
    label: new Date(h.time).toLocaleString("vi-VN", labelFormat),
    rssi: h.rssiDbm,
    ram: h.freeMemoryPercent === null ? null : Number(h.freeMemoryPercent),
    queued: h.queuedReadingCount ?? 0,
    uptime: h.uptimeSeconds === null ? null : Math.round(h.uptimeSeconds / 60),
  }));
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${tone ?? ""}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}

export default function IoTDeviceDetailPage() {
  const { id = "" } = useParams<{ id: string }>();

  // Chưa có endpoint chi tiết dành cho Staff (`GET /{id}` là đường admin, trả cả apiKey), nên
  // lấy thiết bị từ cùng danh sách trang trước đã nạp — TanStack Query trả ngay từ cache.
  const list = useIotDevicesForStaff({
    pageSize: 50,
    sortBy: "lastSeenAt",
    sortDir: "desc",
  });
  const device = list.data?.items.find((d) => d.id === id);

  const heartbeats = useIotDeviceHeartbeats(id, { limit: 100 });
  const rows = useMemo(
    () => toChartRows(heartbeats.data?.items ?? []),
    [heartbeats.data],
  );

  const latest = heartbeats.data?.items[0];

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/staff/iot-devices"
            className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="size-3" />
            Device list
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1 font-mono">
            {device?.deviceCode ?? "Device"}
          </h1>
          {device && (
            <div className="flex items-center gap-2 mt-2">
              <IoTDeviceStatusBadge status={device.status} />
              <span className="text-sm text-muted-foreground">
                {device.displayName}
                {device.siteName ? ` · ${device.siteName}` : ""}
              </span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            heartbeats.refetch();
            list.refetch();
          }}
          disabled={heartbeats.isFetching}
        >
          <RefreshCw
            className={
              heartbeats.isFetching ? "size-3.5 animate-spin" : "size-3.5"
            }
          />
          Refresh
        </Button>
      </div>

      {/* ---- Số liệu mới nhất ---- */}
      {heartbeats.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Last seen"
            value={formatRelativeTime(device?.lastSeenAt ?? latest?.time)}
          />
          <Stat
            label="WiFi signal"
            value={latest?.rssiDbm != null ? `${latest.rssiDbm} dBm` : "—"}
            tone={toneTextClass(rssiTone(latest?.rssiDbm))}
            hint={
              latest?.rssiDbm != null && latest.rssiDbm < WEAK_RSSI_DBM
                ? `Below ${WEAK_RSSI_DBM} dBm — connects but will drop intermittently`
                : undefined
            }
          />
          <Stat
            label="Clock skew"
            value={
              latest?.clockSkewSeconds != null
                ? `${latest.clockSkewSeconds > 0 ? "+" : ""}${Math.round(latest.clockSkewSeconds)} s`
                : "—"
            }
            tone={toneTextClass(clockSkewTone(latest?.clockSkewSeconds))}
            hint={
              latest?.clockSkewSeconds != null &&
              Math.abs(latest.clockSkewSeconds) >= CLOCK_SKEW_REJECT_SECONDS
                ? `Beyond ±${CLOCK_SKEW_REJECT_SECONDS}s — the backend will REJECT provisioning`
                : undefined
            }
          />
          <Stat
            label="Uptime"
            value={formatUptime(latest?.uptimeSeconds)}
            hint={
              latest?.queuedReadingCount
                ? `${latest.queuedReadingCount} readings queued`
                : undefined
            }
          />
        </div>
      )}

      {/* ---- Biểu đồ ---- */}
      {heartbeats.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : heartbeats.isError ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Could not load the heartbeat history.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => heartbeats.refetch()}
          >
            Retry
          </Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            The device has not sent any heartbeat yet.
            {device
              ? ` If it was just installed, wait one interval (${device.heartbeatIntervalSeconds}s) and refresh.`
              : ""}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <p className="text-sm font-medium mb-3">WiFi signal (dBm)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                {/* Miền cố định [-100, -30]: để Recharts tự co giãn thì một dao động 2 dBm
                    trông y hệt một cú sụt 40 dBm. */}
                <YAxis domain={[-100, -30]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rssi"
                  stroke="#0ea5e9"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Free RAM (%)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ram"
                  stroke="#22c55e"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Queued readings</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="queued"
                  stroke="#f59e0b"
                  fill="#fcd34d"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              A rising line means the device is still sampling but CANNOT push
              to the backend — an earlier sign of data loss than spotting gaps
              in the charts.
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Uptime (minutes)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="uptime"
                  stroke="#8b5cf6"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              A drop to 0 means the device just rebooted. Repeated drops mean it
              is boot-looping.
            </p>
          </Card>
        </div>
      )}

      {heartbeats.data?.hasMore && (
        <p className="text-xs text-muted-foreground text-center">
          Showing the 100 most recent samples.
        </p>
      )}
    </div>
  );
}
