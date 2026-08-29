import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReadingEvidence,
  toWarningRows,
} from "@/shared/hooks/battery/useReadingEvidence";

interface Props {
  assetId?: string | null;
  detectedAt?: string | null;
  /** Battery type of the asset — needed to read the SAME thresholds the backend enforced. */
  batteryTypeId?: string | null;
  /** Column label (ticket code) — so the Manager knows which ticket the evidence belongs to. */
  title: string;
}

/**
 * Sensor evidence around the detection time of ONE ticket.
 * Auto-generated tickets have no `detectedAt` → the hook gets disabled, must show a clear
 * message instead of hanging on loading.
 */
export default function CompareEvidencePanel({
  assetId,
  detectedAt,
  title,
}: Props) {
  const { data, isLoading } = useReadingEvidence(assetId, detectedAt);
  const rows = toWarningRows(data?.items ?? []);

  // Hook has enabled: !!assetId && !!detectedAt → never fetches without a timestamp.
  const disabled = !assetId || !detectedAt;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>

      {disabled ? (
        <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          This ticket has no detection timestamp (usually an auto-generated
          ticket) — sensor evidence can't be looked up.
        </p>
      ) : isLoading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          No readings exceeded thresholds within ±2 minutes of detection.
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Time</th>
                <th className="px-2 py-1.5 text-right font-medium">°C</th>
                <th className="px-2 py-1.5 text-right font-medium">SOC%</th>
                <th className="px-2 py-1.5 text-left font-medium">Alert</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.reading.time} className="border-t">
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {format(new Date(w.reading.time), "HH:mm:ss dd/MM")}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {w.reading.temperature.toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {w.reading.socPercent.toFixed(0)}
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="flex flex-wrap gap-1">
                      {w.reasons.map((r) => (
                        <Badge
                          key={r}
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                        >
                          {r}
                        </Badge>
                      ))}
                    </span>
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
