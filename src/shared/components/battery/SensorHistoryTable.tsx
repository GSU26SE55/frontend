import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/shared/components/ui/DatePicker";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReadingHistory } from "@/shared/hooks/battery/useReadingHistory";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { useServerSort } from "@/shared/hooks/useServerSort";
import { toneText, type StatusTone } from "@/shared/theme/statusColors";
import type {
  SensorReadingDto,
  SensorReadingSortKey,
} from "@/shared/types/battery/sensor-reading-history.types";
import type { ThresholdConfigDto } from "@/shared/types/battery/threshold.types";

// datetime-local (local time, no timezone) → ISO UTC for the API. "" → undefined.
const toUtc = (local: string): string | undefined =>
  local ? new Date(local).toISOString() : undefined;

// ISO → the "yyyy-MM-ddTHH:mm" shape the picker expects, in LOCAL time. Slicing the ISO string
// directly would render UTC and shift the window by the timezone offset.
const toLocalInput = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const num = (v: number | null, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

// ── Cell color by threshold (synced with SensorChart's safe zone / danger zone) ──
// Within [min,max] = ok; near the edge (10% margin) = warning (p2); outside the range = danger (p1).
function rangeTone(value: number, min: number, max: number): StatusTone {
  if (value < min || value > max) return "p1";
  const margin = (max - min) * 0.1;
  if (value <= min + margin || value >= max - margin) return "p2";
  return "ok";
}

// SOC is only dangerous when LOW: ≤ critical → p1, ≤ warning → p2, otherwise ok.
function socTone(soc: number, warn: number, crit: number): StatusTone {
  if (soc <= crit) return "p1";
  if (soc <= warn) return "p2";
  return "ok";
}

function voltageTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  return t ? rangeTone(v, t.voltageMin, t.voltageMax) : null;
}
function temperatureTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  return t ? rangeTone(v, t.temperatureMin, t.temperatureMax) : null;
}
// currentMaxCharge/currentMaxDischarge are optional in ThresholdConfigDto.
// Not configured → do NOT color the Current column (return null), rather than guessing
// a default threshold: a color derived from a made-up threshold would diverge from the
// BE's real-threshold alerts, misleading the viewer into thinking it was cross-checked.
function currentTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  if (!t) return null; // no threshold configured → the whole table stays uncolored (stay consistent)
  if (t.currentMaxCharge == null || t.currentMaxDischarge == null) return null;
  return rangeTone(v, -t.currentMaxDischarge, t.currentMaxCharge);
}
function socOf(v: number, t?: ThresholdConfigDto): StatusTone | null {
  return t ? socTone(v, t.socWarningThreshold, t.socCriticalThreshold) : null;
}

// Numbers colored by tone (no threshold yet → shown neutral).
function ToneNum({
  value,
  tone,
  digits = 2,
}: {
  value: number | null;
  tone: StatusTone | null;
  digits?: number;
}) {
  const text = num(value, digits);
  if (tone === null || value === null || value === undefined)
    return <>{text}</>;
  return <span className={cn("font-semibold", toneText(tone))}>{text}</span>;
}

function buildColumns(
  threshold?: ThresholdConfigDto,
): ColumnDef<SensorReadingDto>[] {
  return [
    {
      id: "time",
      header: "Time",
      headClassName: "w-[20%]",
      sortKey: "time",
      sortValue: (r) => new Date(r.time).getTime(),
      cellClassName: "tabular-nums",
      cell: (r) => new Date(r.time).toLocaleString("vi-VN"),
    },
    {
      id: "voltage",
      header: "Voltage (V)",
      sortKey: "voltage",
      sortValue: (r) => r.voltage,
      headClassName: "w-[10%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum value={r.voltage} tone={voltageTone(r.voltage, threshold)} />
      ),
    },
    {
      id: "current",
      header: "Current (A)",
      sortKey: "current",
      sortValue: (r) => r.current,
      headClassName: "w-[18%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum value={r.current} tone={currentTone(r.current, threshold)} />
      ),
    },
    {
      id: "temperature",
      header: "Temperature (°C)",
      sortKey: "temperature",
      sortValue: (r) => r.temperature,
      headClassName: "w-[18%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum
          value={r.temperature}
          tone={temperatureTone(r.temperature, threshold)}
          digits={1}
        />
      ),
    },
    {
      id: "socPercent",
      header: "SOC (%)",
      sortKey: "socPercent",
      sortValue: (r) => r.socPercent,
      headClassName: "w-[18%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum
          value={r.socPercent}
          tone={socOf(r.socPercent, threshold)}
          digits={1}
        />
      ),
    },
  ];
}

interface SensorHistoryTableProps {
  assetId: string;
  batteryTypeId?: string;
  /** Pre-applied range start (ISO) — set when a ticket links here with an incident window. */
  from?: string;
  /** Pre-applied range end (ISO). */
  to?: string;
  /** Clears the URL-supplied range; omitted when there is none. */
  onClearRange?: () => void;
  fillHeight?: boolean;
}

export default function SensorHistoryTable({
  assetId,
  batteryTypeId,
  from: urlFrom,
  to: urlTo,
  onClearRange,
  fillHeight,
}: SensorHistoryTableProps) {
  // Server-side sort (Direction B). Default null → BE returns time desc + normal cursor.
  const sort = useServerSort();
  // Date range filter (datetime-local, local time). Seeded from the URL window when a ticket
  // links here; typing then takes over, so one control drives the query rather than two.
  const [fromLocal, setFromLocal] = useState(() => toLocalInput(urlFrom));
  const [toLocal, setToLocal] = useState(() => toLocalInput(urlTo));

  // A new URL window (different ticket) must win over whatever was typed for the previous one.
  // Re-seeded on key change instead of in an effect — an effect would render once with the
  // stale range and fire a wasted query, and `react-hooks/set-state-in-effect` rejects it.
  const urlKey = `${urlFrom ?? ""}|${urlTo ?? ""}`;
  const [seededFor, setSeededFor] = useState(urlKey);
  if (seededFor !== urlKey) {
    setSeededFor(urlKey);
    setFromLocal(toLocalInput(urlFrom));
    setToLocal(toLocalInput(urlTo));
  }

  const from = toUtc(fromLocal);
  const to = toUtc(toLocal);

  // Direction B: a sort field ≠ time REQUIRES from+to (missing → BE 400). If the user
  // picks a sort other than time without entering a full range → sort isn't applied yet (fallback time desc) + a notice is shown.
  const isFieldSort = !!sort.sortBy && sort.sortBy !== "time";
  const rangeMissing = isFieldSort && (!from || !to);
  const activeSortBy: SensorReadingSortKey | undefined =
    !sort.sortBy || rangeMissing
      ? undefined
      : (sort.sortBy as SensorReadingSortKey);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReadingHistory(assetId, {
      limit: 50,
      from,
      to,
      sortBy: activeSortBy,
      sortDir: activeSortBy ? sort.sortDir : undefined,
    });
  // Threshold by battery type — shares the same source as SensorChart (dedup cache).
  const { data: threshold } = useThresholdByType(batteryTypeId ?? "");

  const columns = useMemo(() => buildColumns(threshold), [threshold]);

  const rows = data?.pages.flatMap((p) => p?.items ?? []) ?? [];

  const hasFilter = !!fromLocal || !!toLocal;

  // An uncolored table looks exactly like "every value is normal" → must state clearly
  // that the threshold is missing, not that it's been cross-checked already.
  const missingThresholdNote = !threshold
    ? "This battery type has no threshold configured — the data below isn't cross-checked."
    : threshold.currentMaxCharge == null ||
        threshold.currentMaxDischarge == null
      ? "Charge/discharge current threshold not configured — the Current (A) column isn't cross-checked."
      : null;

  // Range controls, sized to sit inline on the title row rather than in their own band. The
  // labels moved beside each field (was stacked above) so the whole control keeps the header's
  // height instead of forcing the row taller than the title next to it.
  const rangeControls = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        From
        <DateTimePicker
          value={fromLocal}
          onChange={setFromLocal}
          max={toLocal ? new Date(toLocal) : new Date()}
          className="h-8 w-44"
        />
      </label>
      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        To
        <DateTimePicker
          value={toLocal}
          onChange={setToLocal}
          min={fromLocal ? new Date(fromLocal) : undefined}
          max={new Date()}
          className="h-8 w-44"
        />
      </label>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFromLocal("");
            setToLocal("");
            // Drop the URL window too — leaving it would re-seed the pickers on the next
            // render and silently undo the clear.
            onClearRange?.();
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  // Kept out of the header row: it appears only while a sort is blocked, and letting it push
  // the pickers around mid-interaction made the row jump.
  const rangeHint = rangeMissing && (
    <div className="px-5 pb-2 text-[11px] text-amber-600 dark:text-amber-500">
      Select both "From" and "To" to sort by this column.
    </div>
  );

  const thresholdNotice = missingThresholdNote && (
    <div className="flex items-start gap-2 px-5 py-2.5 border-b border-border text-[11px] text-amber-600 dark:text-amber-500">
      <TriangleAlert className="size-3.5 shrink-0 mt-px" />
      <span>{missingThresholdNote}</span>
    </div>
  );

  const tableContent = isLoading ? (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Loading...
    </div>
  ) : rows.length === 0 ? (
    <div className="py-12 text-center text-sm text-muted-foreground">
      No data yet
    </div>
  ) : (
    <>
      {thresholdNotice}
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.time}
        showIndex
        serverSort={sort}
      />
      {hasNextPage && (
        <div className="py-4 flex justify-center border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );

  if (fillHeight) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-3 border-b border-border shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Sensor history</span>
            {threshold && (
              <span className="text-[11px] text-muted-foreground">
                Colored by the safe threshold of {threshold.batteryTypeName}
              </span>
            )}
          </div>
          {rangeControls}
        </div>
        {rangeHint}
        <div className="flex-1 min-h-0 overflow-y-auto">{tableContent}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <CardTitle className="text-base">Sensor history</CardTitle>
        {rangeControls}
      </CardHeader>
      <CardContent className="px-0">
        {rangeHint}
        <div className="px-6">{tableContent}</div>
      </CardContent>
    </Card>
  );
}
