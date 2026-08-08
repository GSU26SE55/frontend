import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffReadingHistory } from "@/features/staff/hooks/battery/useReadingHistory";

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface Props {
  batteryAssetId?: string | null;
}

/** Recent usage — the 10 latest sensor readings for the battery attached to the ticket. */
export default function BatteryUsageHistoryPanel({ batteryAssetId }: Props) {
  const { data, isLoading } = useStaffReadingHistory(batteryAssetId, 10);
  const readings = data?.items ?? [];

  if (!batteryAssetId) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Activity className="size-4 text-muted-foreground" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Recent usage
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : readings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No sensor data yet.
        </p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Time
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                  V
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                  A
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                  °C
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                  SOC%
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {readings.map((r) => (
                <tr key={r.time}>
                  <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                    {new Date(r.time).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {num(r.voltage)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {num(r.current)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {num(r.temperature, 1)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {num(r.socPercent, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
