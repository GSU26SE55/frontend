import { Link } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Activity, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIncidentDetail } from "@/shared/hooks/alerts/useEnvironmentalIncidents";
import { useSiteDetail } from "@/shared/hooks/site/useSites";
import AmbientEvidencePanel from "@/shared/components/ticket/AmbientEvidencePanel";
import SiteBatteryEvidencePanel from "@/shared/components/ticket/SiteBatteryEvidencePanel";
import { incidentTypeLabel } from "@/shared/constants/incidentLabels";
import { alertSeverityLabel } from "@/shared/constants/alertLabels";
import {
  EnvironmentalIncidentStatusEnum,
  type EnvironmentalIncidentDto,
} from "@/shared/types/alerts/environmental.types";

/** ±2' — same width as the battery evidence window (`useReadingEvidence`). */
const EVIDENCE_WINDOW_MS = 2 * 60 * 1_000;

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
  /**
   * Bản ghi incident — CHỈ có ở đường thiết bị tự báo (khói, rò khí, ngập). Đường ngưỡng ambient
   * không đi qua EnvironmentalIncident nên không có id; khi đó panel bỏ khối chi tiết incident và
   * dựng chứng cứ từ `siteId` + `detectedAt` của chính ticket.
   */
  incidentId?: string;
  /** Site của ticket — dùng khi không có incident record. */
  siteId?: string;
  /** Thời điểm phát hiện lấy từ ticket — mốc để đọc log ambient khi không có incident. */
  detectedAt?: string | null;
  /** Ticket description — carries the raw sensor reading the firmware sent. */
  description?: string | null;
  /**
   * Route prefix that owns a `sites/:id` page. Only Manager and Admin have one — pass nothing
   * for Staff and the site link is omitted rather than rendered as a dead 404.
   */
  siteBasePath?: string;
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
  siteId,
  detectedAt,
  description,
  siteBasePath,
}: Props) {
  const {
    data: incident,
    isLoading,
    isError,
  } = useIncidentDetail(incidentId ?? "");
  // Site lấy từ incident khi có, ngược lại từ chính ticket.
  const effectiveSiteId = incident?.siteId ?? siteId;
  // Called before the early returns — hooks cannot run conditionally. `enabled` inside keeps it
  // idle until a siteId is available.
  const { data: site } = useSiteDetail(effectiveSiteId);

  // Mốc thời gian để đọc log ambient: thời điểm incident được phát hiện, hoặc `detectedAt` của
  // ticket khi ticket sinh thẳng từ ngưỡng ambient.
  const anchorAt = incident?.detectedAt ?? detectedAt ?? null;

  // Link sang trang site, tab Environment, đã lọc sẵn ±2' quanh đúng mốc alert nổ — đối ứng cấp
  // site của nút "View real-time detail" trên panel pin. Một cú bấm là tới đúng phút đang xét,
  // thay vì đổ bộ vào log cả ngày rồi tự dò.
  //
  // Chỉ dựng khi route có trang `sites/:id`: Staff không có, link sang đó là 404.
  const anchorMsShared = anchorAt ? new Date(anchorAt).getTime() : NaN;
  const realtimeHref =
    siteBasePath && effectiveSiteId && !Number.isNaN(anchorMsShared)
      ? `${siteBasePath}/sites/${effectiveSiteId}?${new URLSearchParams({
          tab: "ambient",
          from: new Date(anchorMsShared - EVIDENCE_WINDOW_MS).toISOString(),
          to: new Date(anchorMsShared + EVIDENCE_WINDOW_MS).toISOString(),
        }).toString()}`
      : null;

  const realtimeLink = realtimeHref ? (
    <Link
      to={realtimeHref}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "w-full mb-3",
      )}
    >
      <Activity className="size-3.5" />
      View real-time detail
    </Link>
  ) : null;

  // Không có incident record — đường ngưỡng ambient. Vẫn dựng đủ chứng cứ: đó là toàn bộ lý do
  // ticket này tồn tại, và trước đây màn hình bỏ trắng phần này.
  if (!incidentId) {
    return (
      <div>
        <Header />
        {realtimeLink}
        <div className="divide-y divide-border/50">
          <InfoRow label="Site" value={site?.name ?? null} />
          <InfoRow
            label="Detected at"
            value={
              anchorAt
                ? format(new Date(anchorAt), "HH:mm dd/MM/yyyy", {
                    locale: enUS,
                  })
                : null
            }
          />
        </div>
        <SensorEvidence fallback={description} />
        <AmbientEvidencePanel siteId={effectiveSiteId} anchorAt={anchorAt} />
        <SiteBatteryEvidencePanel
          siteId={effectiveSiteId}
          detectedAt={anchorAt}
        />
      </div>
    );
  }

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

  // ±2' around detectedAt — the moment the condition was observed, which is the span worth
  // reading the ambient log over.
  //
  // Not createdAt: on a manually-reported incident the record can be written long after the
  // fact, so createdAt would point the window at whenever someone got round to filling in the
  // form rather than at the event. The BE requires DetectedAt and rejects values more than 5
  // minutes in the future (EnvironmentalIncidentCommands.ValidateAsync), so it is always set
  // and always sane. Ambient readings are ingested continuously, independent of when the
  // incident record lands, so the log covers detectedAt either way.
  return (
    <div>
      <Header incident={incident} />

      <div className="grid gap-2 mb-3">
        {/*
          Site readings around the detection time — the site-level counterpart of the battery
          ticket's evidence table, and the reason this ticket is defensible.

          The link carries the ±2' window and the tab, so one click lands on the Environment tab
          already filtered instead of on today's full log where the reader has to find the
          incident minute by hand. Rendered only where a site route exists: Staff has no
          `sites/:id` page, so linking there would 404.
        */}
        {realtimeLink}
      </div>

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
          value={format(new Date(incident.detectedAt), "HH:mm dd/MM/yyyy", {
            locale: enUS,
          })}
        />
        {/* Who and where, not the acknowledge/resolve clock: the status badge in the header
            already says where the incident stands, and on an Open one both timestamps are
            empty — a column of dashes where the Manager needs to know whose site is affected. */}
        <InfoRow label="Customer" value={incident.customerName || null} />
        <InfoRow label="Site" value={site?.name ?? null} />
      </div>

      {incident.resolutionNote ? (
        <div className="mt-4">
          <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Resolution note
          </p>
          <p className="text-xs">{incident.resolutionNote}</p>
        </div>
      ) : null}

      <SensorEvidence notes={incident.notes} fallback={description} />

      {/* Inline so Staff sees the readings too — they have no site page to link to. */}
      <AmbientEvidencePanel
        siteId={incident.siteId}
        anchorAt={incident.detectedAt}
      />

      {/* Ambient answers "did something happen in the cabinet"; this answers "has it reached the
          packs, and which ones" — the question the BMS control on this ticket asks the operator
          to settle. */}
      <SiteBatteryEvidencePanel
        siteId={incident.siteId}
        detectedAt={incident.detectedAt}
      />
    </div>
  );
}

function Header({ incident }: { incident?: EnvironmentalIncidentDto }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <AlertTriangle className="size-4 text-muted-foreground" />
      <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
        Environmental incident
      </p>
      {incident ? (
        <Badge
          variant={statusVariant(incident.status)}
          className="ml-auto text-2xs font-normal"
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
      <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
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
          <p className="text-2xs text-muted-foreground mt-1.5">
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

      <p className="text-2xs text-muted-foreground mt-1.5">
        Site-level incident — the fault is in the cabinet, not in one battery,
        so it is cross-checked against the site's ambient readings below rather
        than a per-battery log.
      </p>
    </div>
  );
}
