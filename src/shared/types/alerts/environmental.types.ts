import type {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from "@/shared/enums/alerts/environmental.enum";
import type { AlertSeverityEnum } from "@/shared/enums/alerts/alert.enum";

export {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from "@/shared/enums/alerts/environmental.enum";

export interface EnvironmentalIncidentDto {
  id: string;
  siteId: string;
  /** Customer who owns the site — resolved by the BE from Site.CustomerId. May be empty. */
  customerName: string;
  incidentType: EnvironmentalIncidentTypeEnum;
  status: EnvironmentalIncidentStatusEnum;
  severity: AlertSeverityEnum;
  /**
   * Raw sensor reading from the firmware — e.g. `"MQ-2 raw=3100 > thr=2000 (GPIO1)"`.
   * This is the site-level equivalent of a battery ticket's reading table: the measurement that
   * proves the incident. Free-form, so render it verbatim as a fallback and only parse
   * opportunistically.
   */
  notes?: string | null;
  reportedBy?: string | null;
  detectedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  falseAlarmAt?: string | null;
  falseAlarmReason?: string | null;
  createdAt: string;
}

export interface IncidentListParams {
  pageNumber?: number;
  pageSize?: number;
  siteId?: string;
  status?: EnvironmentalIncidentStatusEnum;
  incidentType?: EnvironmentalIncidentTypeEnum;
  from?: string;
  to?: string;
}

// POST /api/environmental-incidents/manual — a person (Staff/Manager/Admin) reports
// manually with their JWT after spotting fire/smoke/flooding that no sensor picked up.
// reportedBy is taken from the token.
export interface ManualIncidentPayload {
  siteId: string;
  incidentType: EnvironmentalIncidentTypeEnum;
  severity: AlertSeverityEnum;
  // Matches the BE's `ReportEnvironmentalIncidentCommand.Notes` (plural) — get the
  // field name wrong and the BE binds null and silently ignores it, with no error.
  notes?: string;
}

export interface ResolveIncidentPayload {
  resolutionNote: string;
}

export interface FalseAlarmIncidentPayload {
  falseAlarmReason: string;
}
