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

// POST /api/environmental-incidents/manual — người (Staff/Manager/Admin) report thủ công
// bằng JWT khi thấy cháy/khói/ngập mà không có sensor tự động. reportedBy lấy từ token.
export interface ManualIncidentPayload {
  siteId: string;
  incidentType: EnvironmentalIncidentTypeEnum;
  severity: AlertSeverityEnum;
  // Khớp BE `ReportEnvironmentalIncidentCommand.Notes` (số nhiều) — sai tên field
  // thì BE bind null và bỏ qua im lặng, không báo lỗi.
  notes?: string;
}

export interface ResolveIncidentPayload {
  resolutionNote: string;
}

export interface FalseAlarmIncidentPayload {
  falseAlarmReason: string;
}
