import { Badge } from "@/components/ui/badge";
import { useAlertDetail } from "@/shared/hooks/alerts/useAlerts";
import { anomalyTypeLabel } from "@/shared/constants/alertLabels";
import AlertSeverityBadge from "@/shared/components/alerts/AlertSeverityBadge";
import { formatDateTime } from "@/shared/utils/datetime";

interface Props {
  /** The alert this ticket was auto-created from (`ticket.originAlertId`). */
  alertId?: string | null;
}

// Water-leak / bool sensors carry a "wet"/"bool" unit with a 1/0 value — the number is a raw
// boolean flag, not a measurement, so showing it ("1 Wet") reads as a typo. Same convention as
// AlertsView.formatMeasure.
const formatMeasure = (value: number, unit: string | null) =>
  unit?.toLowerCase() === "wet" || unit?.toLowerCase() === "bool"
    ? "Wet"
    : `${value}${unit ? ` ${unit}` : ""}`;

/**
 * Fixed summary of the alert a ticket was auto-created from — Severity/Actual value/Threshold/
 * Detected at. Sits in the ticket sidebar next to Status, so the reason the ticket exists is
 * visible without hovering the small status badge next to Battery device information.
 */
export default function TicketOriginAlertPanel({ alertId }: Props) {
  const { data: alert } = useAlertDetail(alertId ?? "");

  if (!alertId || !alert) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
          Origin alert
        </p>
        <Badge variant="outline" className="text-2xs font-medium">
          {anomalyTypeLabel(alert.anomalyType)}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Severity</span>
          <AlertSeverityBadge severity={alert.severity} />
        </div>
        {alert.actualValue !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Actual value</span>
            <span className="text-xs font-medium">
              {formatMeasure(alert.actualValue, alert.unit)}
            </span>
          </div>
        )}
        {alert.thresholdValue !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Threshold</span>
            <span className="text-xs font-medium">
              {formatMeasure(alert.thresholdValue, alert.unit)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Detected at</span>
          <span className="text-xs font-medium">
            {formatDateTime(alert.detectedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
