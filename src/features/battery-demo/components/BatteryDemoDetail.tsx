import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BatteryDemo } from "@/features/battery-demo/types/battery-demo.types";

interface BatteryDemoDetailProps {
  battery: BatteryDemo | null;
}

export default function BatteryDemoDetail({ battery }: BatteryDemoDetailProps) {
  if (!battery) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg p-8">
        Chọn một pin để xem chi tiết
      </div>
    );
  }

  const { lastReading } = battery;
  const recordedAt = new Date(lastReading.recordedAt).toLocaleString("vi-VN");

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{battery.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {battery.serialNumber}
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1">
            {battery.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Vị trí</p>
          <p className="font-medium">{battery.location}</p>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-semibold mb-3">State of Health (SOH)</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${battery.soh}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-green-600">
              {battery.soh}%
            </span>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-semibold mb-3">Sensor Reading cuối</p>
          <p className="text-xs text-muted-foreground mb-3">{recordedAt}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Điện áp</p>
              <p className="text-lg font-bold mt-1">{lastReading.voltage}</p>
              <p className="text-xs text-muted-foreground">V</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Dòng điện</p>
              <p className="text-lg font-bold mt-1">{lastReading.current}</p>
              <p className="text-xs text-muted-foreground">A</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Nhiệt độ</p>
              <p className="text-lg font-bold mt-1">
                {lastReading.temperature}
              </p>
              <p className="text-xs text-muted-foreground">°C</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
