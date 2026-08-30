import { useCallback, useState } from "react";
import {
  Battery,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import {
  useReadingEvidence,
  toWarningRows,
  countBreaches,
} from "@/shared/hooks/battery/useReadingEvidence";
import { useSiteSwitchableAssets } from "@/shared/hooks/battery/useSiteSwitchableAssets";
import { formatDateTime } from "@/shared/utils/datetime";
import type { BatteryAssetDto } from "@/shared/types/battery/battery.types";

/**
 * Per-battery sensor readings on a SITE ticket, around the moment the incident was detected.
 *
 * A site ticket carries no `batteryAssetId` — the fault is in the cabinet — so its only evidence
 * used to be the ambient log: smoke, gas, room temperature. That answers "did something happen"
 * but not the question the responder actually has to settle, which is **has it reached the
 * batteries, and which ones**. Smoke over a cabinet where every pack sits at 25°C is a different
 * call from one where a pack is climbing through 60°C, and the difference was only visible by
 * opening each battery's own screen one at a time.
 *
 * It matters most for the BMS control on this same ticket: that dialog asks the operator to pick
 * which batteries to cut. Without readings beside it, it is a list of serial numbers with
 * nothing to choose on.
 *
 * The table deliberately mirrors `BatteryWarningEvidencePanel` — the evidence panel on a
 * single-battery ticket — column for column: same ±2' window, same amber treatment, same
 * breach badges, same show-more/collapse. Two evidence tables that look different invite the
 * reader to think they mean different things; they do not. The one structural difference is
 * that a site holds several batteries, so each gets a collapsible section instead of the panel
 * owning a single table.
 *
 * Rows are judged by the anomalies the BACKEND scored per reading, so a flag here means exactly
 * what it means on a battery ticket.
 */

/** Rows shown per battery before "Show more" — matches BatteryWarningEvidencePanel. */
const PREVIEW_ROWS = 10;
const LOAD_MORE_STEP = 25;

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

/** One battery. Its own component so each can own a query and its own expand state. */
function BatterySection({
  asset,
  detectedAt,
  defaultOpen,
  onBreachCount,
}: {
  asset: BatteryAssetDto;
  detectedAt: string | null | undefined;
  defaultOpen: boolean;
  /** Reports this battery's breach count up so the panel header can total them. */
  onBreachCount: (assetId: string, count: number) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [limit, setLimit] = useState(PREVIEW_ROWS);
  const { data, isLoading } = useReadingEvidence(asset.id, detectedAt);

  const warnings = toWarningRows(data?.items ?? []);
  const breachCount = countBreaches(warnings);

  // Each battery loads independently, so the header total can only be assembled from what the
  // sections report as their queries settle. Reported during render (not in an effect) and
  // deduped by the parent, which ignores a value it already holds.
  onBreachCount(asset.id, breachCount);
  const visibleRows = warnings.slice(0, limit);
  const hiddenCount = warnings.length - visibleRows.length;

  // Newest reading in the window doubles as the "state at detection" summary on the header,
  // so a collapsed battery still says something.
  const latest = [...(data?.items ?? [])].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  )[0];
  const inactive = asset.status !== BatteryStatusEnum.Active;

  return (
    <div className="overflow-hidden rounded-md border border-amber-300 dark:border-amber-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={warnings.length === 0}
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs ${
          warnings.length > 0
            ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
            : "cursor-default bg-muted/40"
        }`}
      >
        {warnings.length > 0 ? (
          open ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}

        <span className="min-w-0 flex-1 truncate font-mono">
          {asset.serialNumber}
        </span>

        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : latest ? (
          // Breach count for THIS battery, right-aligned. On a site with several packs it is
          // what tells them apart while the sections are collapsed; the readings themselves
          // live in the table below.
          breachCount > 0 && (
            <span className="ml-auto shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-3xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              {breachCount}
            </span>
          )
        ) : (
          // A pack that stopped reporting during an incident is not a pack that is fine —
          // say which of the two silences this is.
          <span className="ml-auto shrink-0 text-2xs text-muted-foreground">
            {inactive ? "Inactive" : "No reading"}
          </span>
        )}
      </button>

      {open && warnings.length > 0 && (
        <>
          {breachCount === 0 && (
            <p className="border-t border-amber-200/60 px-2 py-1.5 text-xs text-muted-foreground dark:border-amber-900/60">
              No reading breached the configured limits — the rows below are the
              sensor context around the reported time.
            </p>
          )}
          <div className="overflow-x-auto border-t border-amber-200/60 dark:border-amber-900/60">
            <table className="w-full text-xs">
              <thead className="bg-amber-50 dark:bg-amber-950/40">
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
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                    Alert
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/60 dark:divide-amber-900/60">
                {visibleRows.map(({ reading: r, reasons }) => {
                  const isTrigger =
                    !!detectedAt &&
                    new Date(r.time).getTime() ===
                      new Date(detectedAt).getTime();
                  return (
                    <tr
                      key={r.time}
                      className={
                        isTrigger
                          ? "bg-amber-100 font-medium dark:bg-amber-900/40"
                          : reasons.length > 0
                            ? "bg-amber-50/50 dark:bg-amber-950/20"
                            : ""
                      }
                    >
                      <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-muted-foreground">
                        {formatDateTime(r.time)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${
                          reasons.some(
                            (x) =>
                              x.startsWith("Overvoltage") ||
                              x.startsWith("Undervoltage"),
                          )
                            ? "font-medium text-amber-700 dark:text-amber-400"
                            : ""
                        }`}
                      >
                        {num(r.voltage)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {num(r.current)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${
                          reasons.some(
                            (x) =>
                              x.startsWith("Overheating") ||
                              x.startsWith("Low temperature"),
                          )
                            ? "font-medium text-amber-700 dark:text-amber-400"
                            : ""
                        }`}
                      >
                        {num(r.temperature, 1)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {num(r.socPercent, 1)}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-wrap gap-1">
                          {reasons.map((reason) => (
                            <span
                              key={reason}
                              className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-3xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setLimit((v) => v + LOAD_MORE_STEP)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-amber-200/60 bg-amber-50/60 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              Show {Math.min(LOAD_MORE_STEP, hiddenCount)} more rows
              <span className="font-normal text-muted-foreground">
                {hiddenCount} left
              </span>
              <ChevronDown className="size-3.5" />
            </button>
          )}

          {hiddenCount === 0 && warnings.length > PREVIEW_ROWS && (
            <button
              type="button"
              onClick={() => setLimit(PREVIEW_ROWS)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-amber-200/60 bg-amber-50/60 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              Collapse
              <ChevronUp className="size-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function SiteBatteryEvidencePanel({
  siteId,
  detectedAt,
}: {
  siteId: string | null | undefined;
  /** The incident's detection time — the same anchor the ambient evidence table uses. */
  detectedAt: string | null | undefined;
}) {
  const { data, isLoading } = useSiteSwitchableAssets(siteId ?? "", !!siteId);
  const [breachByAsset, setBreachByAsset] = useState<Record<string, number>>(
    {},
  );

  // Ignore a repeat of a value already held: the sections report on every render, and setting
  // state unconditionally from a child's render would loop.
  const handleBreachCount = useCallback((assetId: string, count: number) => {
    setBreachByAsset((prev) =>
      prev[assetId] === count ? prev : { ...prev, [assetId]: count },
    );
  }, []);

  if (!siteId || !detectedAt) return null;

  const assets = data?.assets ?? [];
  const totalBreaches = Object.values(breachByAsset).reduce(
    (sum, n) => sum + n,
    0,
  );

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <ShieldAlert className="size-4 text-amber-600" />
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Battery evidence (at detection time)
        </p>
        {/* Total across every battery on the site — the same badge the single-battery
            evidence panel puts next to its title. */}
        {totalBreaches > 0 && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-3xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            {totalBreaches}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-2xs text-muted-foreground">
          <Battery className="size-3" />
          {assets.length} batter{assets.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : assets.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No battery is registered at this site.
        </p>
      ) : (
        <div className="space-y-2">
          {assets.map((asset, index) => (
            <BatterySection
              key={asset.id}
              asset={asset}
              detectedAt={detectedAt}
              // Only the first section starts open: several expanded tables at once would
              // bury the ambient evidence above and the ticket's own actions below.
              defaultOpen={index === 0}
              onBreachCount={handleBreachCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
