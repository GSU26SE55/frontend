import { useState } from "react";
import { Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAmbientEvidence } from "@/shared/hooks/ambient/useAmbientEvidence";
import { useAmbientThresholdBySite } from "@/shared/hooks/ambient/useAmbient";
import {
  evaluateAmbientRow,
  ambientLevelTextClass,
  ambientLevelRowClass,
} from "@/shared/lib/ambientThresholds";

/** Rows shown before "Show more" — matches the battery evidence panel. */
const PREVIEW_ROWS = 10;
const LOAD_MORE_STEP = 25;

const fmt = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

const formatDateTime = (iso: string) => new Date(iso).toLocaleString("vi-VN");

interface Props {
  siteId?: string | null;
  /**
   * Anchor for the ±2' window — the incident's `detectedAt` (when the condition was observed),
   * not `createdAt`, which on a manual report can trail the event by hours.
   */
  anchorAt?: string | null;
}

/**
 * Ambient readings around an environmental incident — the site-level counterpart of
 * `BatteryWarningEvidencePanel`.
 *
 * A site ticket used to show a single parsed sensor line ("MQ-2 raw=3100 > thr=2000") and
 * nothing else, so there was no way to tell a genuine event from one stray sample. A battery
 * ticket right beside it showed the temperature climbing 41→71°C across a dozen rows. This
 * gives the site ticket the same standard of evidence, and colours each value against the
 * site's OWN configured thresholds — the same numbers the "Alert threshold" drawer edits and
 * the backend alerts on — so a breach is visible at a glance instead of read off a number.
 *
 * Filtering is done by the BACKEND (`GetAmbientReadingHistoryQuery` applies `Time >= From` /
 * `Time <= To`), not by trimming a full page client-side.
 */
export default function AmbientEvidencePanel({ siteId, anchorAt }: Props) {
  const { data, isLoading } = useAmbientEvidence(siteId, anchorAt);
  const { data: threshold } = useAmbientThresholdBySite(siteId ?? "");
  const [limit, setLimit] = useState(PREVIEW_ROWS);

  // Readings arrive newest-first; the incident reads better oldest-first, as a build-up toward
  // the detection stamp rather than a countdown away from it.
  const rows = [...(data?.items ?? [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const visible = rows.slice(0, limit);
  const hidden = rows.length - visible.length;

  if (!siteId || !anchorAt) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2">
        <Thermometer className="size-4 text-amber-600" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Site readings
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : rows.length === 0 ? (
        // Distinguish "sensor reported nothing" from "we failed to load": the incident is still
        // valid, its evidence just isn't in the ambient log.
        <p className="text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          No ambient readings recorded in this window.
        </p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium px-2 py-1.5">Time</th>
                  <th className="text-right font-medium px-2 py-1.5">°C</th>
                  <th className="text-right font-medium px-2 py-1.5">RH%</th>
                  <th className="text-right font-medium px-2 py-1.5">W/m²</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const ev = evaluateAmbientRow(r, threshold);
                  return (
                    <tr
                      key={r.time}
                      className={`border-t border-border/50 ${ambientLevelRowClass(ev.worst)}`}
                    >
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground whitespace-nowrap">
                        {formatDateTime(r.time)}
                        {/* The combo rule can fire while both metrics sit under their own
                            limits, so it needs saying — otherwise the row looks mis-coloured. */}
                        {ev.combo ? (
                          <span className="ml-1.5 text-[10px] text-amber-700 dark:text-amber-500">
                            combo
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${ambientLevelTextClass(ev.temperature)}`}
                      >
                        {fmt(r.ambientTemperature)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${ambientLevelTextClass(ev.humidity)}`}
                      >
                        {fmt(r.humidity)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {fmt(r.solarIrradiance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hidden > 0 ? (
            <button
              type="button"
              className="w-full border-t border-border/50 py-1.5 text-xs text-amber-700 dark:text-amber-500 hover:bg-muted/50"
              onClick={() => setLimit((n) => n + LOAD_MORE_STEP)}
            >
              Show {Math.min(hidden, LOAD_MORE_STEP)} more rows ({hidden} left)
            </button>
          ) : null}
        </div>
      )}

      {threshold && !threshold.enabled ? (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Threshold monitoring is off for this site — values are shown unmarked.
        </p>
      ) : null}
    </div>
  );
}
