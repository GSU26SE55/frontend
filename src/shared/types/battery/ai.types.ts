// BE-AI — types cho SohPrediction + AnomalyClassification (khớp BE DTO).
// Dùng chung admin/manager/staff → shared.
import type {
  AnomalyClassificationEnum,
  StaffFeedbackEnum,
} from "@/shared/enums/battery/ai.enum";

export {
  AnomalyClassificationEnum,
  StaffFeedbackEnum,
} from "@/shared/enums/battery/ai.enum";

export interface SohPredictionDto {
  id: string;
  batteryAssetId: string;
  predictedSohPercent: number;
  confidence: number;
  modelVersion: string;
  predictedAt: string; // ISO UTC
  latencyMs: number;
}

export interface AnomalyClassificationDto {
  id: string;
  alertId: string | null;
  batteryAssetId: string;
  classification: AnomalyClassificationEnum;
  anomalyScore: number;
  confidence: number;
  modelVersion: string;
  classifiedAt: string; // ISO UTC
  latencyMs: number;
  staffFeedback: StaffFeedbackEnum | null;
  staffFeedbackByUserId: string | null;
  staffFeedbackAt: string | null;
}

export interface SohPredictionListParams {
  batteryAssetId: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AnomalyClassificationListParams {
  batteryAssetId: string;
  classification?: AnomalyClassificationEnum;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}
