import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAlertDetail } from "@/shared/hooks/alerts/useAlerts";
import { toneClass, ALERT_STATUS_TONE } from "@/shared/theme/statusColors";
import {
  ALERT_STATUS_LABELS,
  anomalyTypeLabel,
  alertSeverityLabel,
} from "@/shared/constants/alertLabels";
import { formatDateTime } from "@/shared/utils/datetime";

interface Props {
  alertId: string;
}

/**
 * Ticket header badge for the alert a ticket was auto-created from. Hover shows the alert's own
 * detail (type/severity/detected/acknowledged) inline — the same pattern as CustomerHoverCard —
 * so the reader doesn't have to leave the ticket to see what the alert actually says.
 */
export default function AlertStatusHoverCard({ alertId }: Props) {
  const { data: alert, isLoading, isError } = useAlertDetail(alertId);

  if (isLoading || isError || !alert) return null;

  return (
    <HoverCard>
      <HoverCardTrigger className="ml-auto cursor-default">
        <Badge
          variant="outline"
          className={cn(
            "text-2xs font-normal",
            toneClass(ALERT_STATUS_TONE[alert.status]),
          )}
        >
          {ALERT_STATUS_LABELS[alert.status] ?? alert.status}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-64">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {anomalyTypeLabel(alert.anomalyType)}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-2xs font-normal shrink-0",
                toneClass(ALERT_STATUS_TONE[alert.status]),
              )}
            >
              {ALERT_STATUS_LABELS[alert.status] ?? alert.status}
            </Badge>
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>Severity</span>
              <span className="font-medium text-foreground">
                {alertSeverityLabel(alert.severity)}
              </span>
            </div>
            {alert.actualValue !== null && (
              <div className="flex items-center justify-between gap-2">
                <span>Actual value</span>
                <span className="font-medium text-foreground">
                  {alert.actualValue}
                  {alert.unit ? ` ${alert.unit}` : ""}
                </span>
              </div>
            )}
            {alert.thresholdValue !== null && (
              <div className="flex items-center justify-between gap-2">
                <span>Threshold</span>
                <span className="font-medium text-foreground">
                  {alert.thresholdValue}
                  {alert.unit ? ` ${alert.unit}` : ""}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span>Detected at</span>
              <span className="font-medium text-foreground">
                {formatDateTime(alert.detectedAt)}
              </span>
            </div>
            {alert.resolvedAt && (
              <div className="flex items-center justify-between gap-2">
                <span>Resolved at</span>
                <span className="font-medium text-foreground">
                  {formatDateTime(alert.resolvedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
