import type {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from "@/shared/enums/environmental.enum";
import type { AlertSeverityEnum } from "@/shared/enums/alert.enum";

export {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from "@/shared/enums/environmental.enum";

export interface EnvironmentalIncidentDto {
  id: string;
  siteId: string;
  incidentType: EnvironmentalIncidentTypeEnum;
  status: EnvironmentalIncidentStatusEnum;
  severity: AlertSeverityEnum;
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

export interface ResolveIncidentPayload {
  resolutionNote: string;
}

export interface FalseAlarmIncidentPayload {
  falseAlarmReason: string;
}
