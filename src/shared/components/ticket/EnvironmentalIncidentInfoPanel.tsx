import { Link } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIncidentDetail } from "@/shared/hooks/alerts/useEnvironmentalIncidents";
import { incidentTypeLabel } from "@/shared/constants/incidentLabels";
import { alertSeverityLabel } from "@/shared/constants/alertLabels";
import {
  EnvironmentalIncidentStatusEnum,
  type EnvironmentalIncidentDto,
} from "@/shared/types/alerts/environmental.types";

const STATUS_LABEL: Record<EnvironmentalIncidentStatusEnum, string> = {
  [EnvironmentalIncidentStatusEnum.Open]: "Open",
  [EnvironmentalIncidentStatusEnum.Acknowledged]: "Acknowledged",
  [EnvironmentalIncidentStatusEnum.Resolved]: "Resolved",
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: "False alarm",
};

/**
 * A resolved or false-alarm incident is settled; anything else still needs someone on site.
 * Colouring by that split rather than by severity is deliberate — every incident that reaches a
 * ticket is Critical, so a severity-driven badge would be red on all of them and carry no signal.
 */
function statusVariant(
  status: EnvironmentalIncidentStatusEnum,
): "default" | "secondary" | "destructive" {
  if (status === EnvironmentalIncidentStatusEnum.Resolved) return "secondary";
  if (status === EnvironmentalIncidentStatusEnum.FalseAlarm) return "secondary";
  return "destructive";
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

interface Props {
  incidentId: string;
  /** Ticket description — carries the raw sensor reading the firmware sent. */
  description?: string | null;
  /** Route prefix for the incident list, e.g. "/manager" or "/staff". */
  basePath: string;
}

/**
 * Info panel for a ticket auto-created from an environmental incident.
 *
 * Replaces the battery panel on site-level tickets. Those tickets carry
 * `batteryAssetId = Guid.Empty` because the fault is in the cabinet, not in one battery — so the
 * battery layout rendered a column of blanks, a "Battery serial —" that can never fill in, and
 * the message "This ticket isn't linked to any battery device", which reads as *missing data*
 * rather than *not applicable*. The evidence was there all along, buried in the auto-generated
 * description ("MQ-2 raw=3100 > thr=2000"); this panel promotes it to the top and links out to
 * the incident record so the Manager can acknowledge or resolve it.
 */
export default function EnvironmentalIncidentInfoPanel({
  incidentId,
  description,
  basePath,
}: Props) {
  const { data: incident, isLoading, isError } = useIncidentDetail(incidentId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  // Fall back to the description rather than an error box: the ticket itself is valid and its
  // sensor evidence is readable even when the incident record can't be fetched.
  if (isError || !incident) {
    return (
      <div>
        <Header />
        <p className="text-xs text-muted-foreground mt-2">
          Couldn't load the incident record.
        </p>
        <SensorEvidence fallback={description} />
      </div>
    );
  }

  return (
    <div>
      <Header incident={incident} />

      <Link
        to={`${basePath}/environmental-incidents`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full mb-3",
        )}
      >
        <ExternalLink className="size-3.5" />
        View incident record
      </Link>

      <div className="divide-y divide-border/50">
        <InfoRow
          label="Incident type"
          value={incidentTypeLabel(incident.incidentType)}
        />
        <InfoRow
          label="Severity"
          value={alertSeverityLabel(incident.severity)}
        />
        <InfoRow
          label="Detected at"
          value={format(new Date(incident.detectedAt), "HH:mm MM/dd/yyyy", {
            locale: enUS,
          })}
        />
        <InfoRow
          label="Acknowledged"
          value={
            incident.acknowledgedAt
              ? format(new Date(incident.acknowledgedAt), "HH:mm MM/dd/yyyy", {
                  locale: enUS,
                })
              : null
          }
        />
        <InfoRow
          label="Resolved"
          value={
            incident.resolvedAt
              ? format(new Date(incident.resolvedAt), "HH:mm MM/dd/yyyy", {
                  locale: enUS,
                })
              : null
          }
        />
      </div>

      {incident.resolutionNote ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Resolution note
          </p>
          <p className="text-xs">{incident.resolutionNote}</p>
        </div>
      ) : null}

      <SensorEvidence notes={incident.notes} fallback={description} />
    </div>
  );
}

function Header({ incident }: { incident?: EnvironmentalIncidentDto }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <AlertTriangle className="size-4 text-muted-foreground" />
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Environmental incident
      </p>
      {incident ? (
        <Badge
          variant={statusVariant(incident.status)}
          className="ml-auto text-[11px] font-normal"
        >
          {STATUS_LABEL[incident.status] ?? incident.status}
        </Badge>
      ) : null}
    </div>
  );
}

/**
 * Firmware writes the reading as `"<sensor> raw=<measured> > thr=<limit> (<pin>)"`. Pulling the
 * two numbers out lets the panel show a breach the same way a battery ticket does — measured
 * value against the limit it crossed — instead of leaving the Manager to read it out of a
 * sentence.
 *
 * Returns null on anything that doesn't match, and the caller then prints the text as-is. That
 * matters: `notes` is free-form (case 22 sends just `"water leak GPIO2"`, no numbers at all), so
 * a parser that guessed would invent a threshold that was never checked.
 */
function parseSensorReading(notes: string): {
  sensor: string;
  measured: string;
  limit: string;
} | null {
  const m = notes.match(/^(.+?)\s+raw=([\d.]+)\s*>\s*thr=([\d.]+)/i);
  if (!m) return null;
  return { sensor: m[1].trim(), measured: m[2], limit: m[3] };
}

/**
 * Sensor evidence for a site-level incident — the counterpart of the reading table on a battery
 * ticket, and the reason that ticket is defensible.
 *
 * Source is `incident.notes`, NOT the ticket description. The description is an auto-generated
 * sentence that wraps the reading in boilerplate and raw enum codes ("type 3, severity 3"), and
 * it already appears verbatim in the sidebar — repeating it here cost the Manager a second read
 * to find the one number that matters. `notes` carries just the firmware's own measurement.
 */
function SensorEvidence({
  notes,
  fallback,
}: {
  notes?: string | null;
  fallback?: string | null;
}) {
  const text = notes?.trim() || fallback?.trim();
  if (!text) return null;

  const reading = parseSensorReading(text);

  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        Sensor evidence
      </p>

      {reading ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {reading.sensor}
            </span>
            <span className="text-xs font-mono">
              <span className="font-semibold text-destructive">
                {reading.measured}
              </span>
              <span className="text-muted-foreground">
                {" > "}
                {reading.limit}
              </span>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Measured {reading.measured} against a limit of {reading.limit} —
            over threshold.
          </p>
        </div>
      ) : (
        // Unparsed readings still carry the fault; showing the raw line beats hiding it.
        <p className="text-xs font-mono bg-muted/50 rounded-md px-3 py-2 wrap-break-word">
          {text}
        </p>
      )}

      <p className="text-[11px] text-muted-foreground mt-1.5">
        Site-level incident — the fault is in the cabinet, not in one battery,
        so there is no battery reading log to cross-check.
      </p>
    </div>
  );
}
