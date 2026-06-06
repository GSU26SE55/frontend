import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBatteryAssetRealtime } from "@/features/admin/hooks/useBatteryAssetRealtime";

const fmt = (v: number | null | undefined, unit = "") =>
  v !== null && v !== undefined ? `${v}${unit}` : "—";

interface BatteryRealtimeCardProps {
  assetId: string;
}

export default function BatteryRealtimeCard({
  assetId,
}: BatteryRealtimeCardProps) {
  const { data, isLoading } = useBatteryAssetRealtime(assetId);

  if (isLoading)
    return (
      <div className="text-sm text-muted-foreground">
        Đang tải dữ liệu realtime...
      </div>
    );
  if (!data)
    return (
      <div className="text-sm text-muted-foreground">
        Chưa có dữ liệu sensor
      </div>
    );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Realtime
          {data.activeAlerts > 0 && (
            <Badge variant="destructive">{data.activeAlerts} cảnh báo</Badge>
          )}
        </CardTitle>
        {data.time && (
          <p className="text-xs text-muted-foreground">
            {new Date(data.time).toLocaleString("vi-VN")}
          </p>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Điện áp</span>
          <span className="font-medium">{fmt(data.voltage, " V")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dòng điện</span>
          <span className="font-medium">{fmt(data.current, " A")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nhiệt độ</span>
          <span className="font-medium">{fmt(data.temperature, " °C")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">SOC</span>
          <span className="font-medium">{fmt(data.socPercent, "%")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">SOH</span>
          <span className="font-medium">{fmt(data.sohPercent, "%")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Số chu kỳ</span>
          <span className="font-medium">{fmt(data.cycleCount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
