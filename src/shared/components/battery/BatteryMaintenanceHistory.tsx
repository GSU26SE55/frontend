import { format, differenceInCalendarDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import {
  CalendarClock,
  TrendingDown,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";
import { useBatteryMaintenanceHistory } from "@/shared/hooks/battery/useBatteryMaintenanceHistory";
import type { MaintenanceCycleDTO } from "@/shared/types/battery/maintenance-cycle.types";

const fmtDate = (value?: string | null) =>
  value ? format(new Date(value), "MM/dd/yyyy", { locale: enUS }) : "—";

/** Kỳ tiếp theo — đọc thẳng từ asset, không suy ra từ danh sách kỳ. */
function NextCycleBanner({ assetId }: { assetId: string }) {
  const { data: asset } = useBatteryAsset(assetId);
  if (!asset?.nextMaintenanceDueAtUtc) return null;

  const days = differenceInCalendarDays(
    new Date(asset.nextMaintenanceDueAtUtc),
    new Date(),
  );

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          Last checkpoint
        </p>
        <p className="text-sm tabular-nums">
          {asset.lastMaintenanceAtUtc
            ? fmtDate(asset.lastMaintenanceAtUtc)
            : "None yet"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          Next due
        </p>
        <p className="text-sm tabular-nums">
          {fmtDate(asset.nextMaintenanceDueAtUtc)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          Cycle
        </p>
        <p className="text-sm tabular-nums">
          Every {asset.maintenanceIntervalMonths} months
        </p>
      </div>
      <div className="ml-auto">
        {days < 0 ? (
          <Badge variant="destructive">Overdue by {Math.abs(days)}d</Badge>
        ) : (
          <Badge variant="outline">In {days}d</Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Sức khoẻ pin thay đổi thế nào so với kỳ trước.
 *
 * Đây là lý do nhật ký được lưu theo kỳ: SoH hiện tại xem realtime là biết, nhưng SoH tại
 * từng mốc thì không tái tạo lại được — đặt cạnh nhau mới thấy đường suy giảm.
 */
function SohDelta({
  current,
  previous,
}: {
  current?: number | null;
  previous?: number | null;
}) {
  if (current == null)
    return <span className="text-sm text-muted-foreground">—</span>;

  // Làm tròn TRƯỚC khi so sánh: 81.13 - 81.13 có thể ra -0 trong dấu phẩy động, và
  // (-0).toFixed(1) in ra "-0.0" — một mức sụt giả không hề tồn tại.
  const raw = previous == null ? null : current - previous;
  const delta = raw === null ? null : Math.round(raw * 10) / 10;
  // Không đổi thì không hiện gì: một dòng "0.0" chỉ làm nhiễu, người đọc quan tâm
  // pin có tụt hay không, chứ không cần xác nhận là nó đứng yên.
  const changed = delta !== null && delta !== 0;

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold tabular-nums">{current}%</span>
      {changed && (
        <span
          className={`flex items-center gap-0.5 text-xs tabular-nums ${
            delta < 0 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {delta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  /** "warn" tô đỏ — dùng cho chỉ số cần chú ý, không phải cho mọi số. */
  tone?: "warn";
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </p>
      <p
        className={`text-sm tabular-nums ${tone === "warn" ? "text-destructive" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

/** Tình trạng pin trong kỳ — chỉ những chỉ số BE thực sự chụp được. */
function CycleDetail({ cycle }: { cycle: MaintenanceCycleDTO }) {
  // readingCount = 0 nghĩa là pin mất kết nối suốt kỳ, khác hẳn với "chưa chụp".
  // Kỳ ghi trước khi tính năng này có thì readingCount là null.
  if (cycle.readingCount == null) {
    return (
      <p className="px-4 pb-3 text-xs text-muted-foreground italic">
        No readings were captured for this cycle.
      </p>
    );
  }

  if (cycle.readingCount === 0) {
    return (
      <p className="px-4 pb-3 text-xs text-muted-foreground italic">
        The battery reported no sensor data during this cycle.
      </p>
    );
  }

  const temp =
    cycle.avgTemperatureCelsius != null
      ? `${cycle.avgTemperatureCelsius}°C avg · ${cycle.maxTemperatureCelsius}°C peak`
      : "—";
  const voltage =
    cycle.minVoltage != null
      ? `${cycle.minVoltage}V – ${cycle.maxVoltage}V`
      : "—";
  const alerts =
    cycle.alertCount == null
      ? "—"
      : cycle.criticalAlertCount
        ? `${cycle.alertCount} (${cycle.criticalAlertCount} critical)`
        : `${cycle.alertCount}`;

  return (
    <div className="grid grid-cols-2 gap-4 border-t border-border px-4 py-3 sm:grid-cols-4">
      <Stat label="Temperature" value={temp} />
      <Stat label="Voltage range" value={voltage} />
      <Stat
        label="Charge cycles"
        value={
          cycle.cycleCountDelta != null ? `+${cycle.cycleCountDelta}` : "—"
        }
      />
      <Stat
        label="Alerts"
        value={alerts}
        tone={cycle.criticalAlertCount ? "warn" : undefined}
      />
    </div>
  );
}

function CycleRow({
  cycle,
  previousSoh,
}: {
  cycle: MaintenanceCycleDTO;
  previousSoh?: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
          {cycle.cycleNo}
        </div>
        <p className="text-sm tabular-nums">{fmtDate(cycle.dueAtUtc)}</p>
        <div className="ml-auto">
          <SohDelta current={cycle.sohPercentAtCycle} previous={previousSoh} />
        </div>
      </button>
      {open && <CycleDetail cycle={cycle} />}
    </div>
  );
}

/**
 * Nhật ký bảo trì định kỳ của một cục pin — pin đã qua những mốc nào, và sức khoẻ thay đổi
 * ra sao qua từng kỳ. Mốc do hệ thống tự ghi khi đến hạn; không gắn với ticket.
 */
export default function BatteryMaintenanceHistory({
  assetId,
}: {
  assetId: string;
}) {
  const {
    data: cycles = [],
    isLoading,
    isError,
  } = useBatteryMaintenanceHistory(assetId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Couldn't load maintenance history.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <NextCycleBanner assetId={assetId} />

      {cycles.length === 0 ? (
        <div className="space-y-2 py-12 text-center">
          <CalendarClock
            size={28}
            className="mx-auto text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">
            No maintenance checkpoint recorded yet.
          </p>
          <p className="mx-auto max-w-md text-xs text-muted-foreground/80">
            The first one is recorded automatically when the cycle comes due.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cycles.map((cycle, i) => (
            <CycleRow
              key={cycle.id}
              cycle={cycle}
              // Danh sách xếp kỳ mới nhất trước, nên kỳ liền trước nằm ở index sau.
              previousSoh={cycles[i + 1]?.sohPercentAtCycle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
