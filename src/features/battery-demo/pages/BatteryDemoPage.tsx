import { useState } from "react";
import { mockBatteries } from "@/features/battery-demo/data/mockBatteries";
import BatteryDemoCard from "@/features/battery-demo/components/BatteryDemoCard";
import BatteryDemoDetail from "@/features/battery-demo/components/BatteryDemoDetail";

export default function BatteryDemoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedBattery =
    mockBatteries.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Battery Monitor — Demo</h1>
          <p className="text-muted-foreground mt-1">
            Luồng pin bình thường · Mock data · {mockBatteries.length} pin đang
            hoạt động
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Danh sách pin
            </h2>
            {mockBatteries.map((battery) => (
              <BatteryDemoCard
                key={battery.id}
                battery={battery}
                selected={selectedId === battery.id}
                onClick={() => setSelectedId(battery.id)}
              />
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Chi tiết
            </h2>
            <BatteryDemoDetail battery={selectedBattery} />
          </div>
        </div>
      </div>
    </div>
  );
}
