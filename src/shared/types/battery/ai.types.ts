// BE-AI — types for SohPrediction + AnomalyClassification (matching the BE DTOs).
// Shared by admin/manager/staff → lives in shared.
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

export interface LongSohDto {
  batteryAssetId: string;
  sohPercent: number;
  seqLen: number;
  device: string;
  latencyMs: number;
  modelVersion: string;
}

export interface BatchPredictionItemDto {
  batteryAssetId: string;
  sohPercent: number;
  classification: string;
  healthStage: string | null;
  riskLevel: string | null;
  actionCode: string | null;
  isBorderline: boolean;
  isTemperatureOod: boolean;
}

export interface BatchPredictionDto {
  items: BatchPredictionItemDto[];
  requestedCount: number;
  isComplete: boolean;
  abortReason: string | null;
}

export interface GetLongSohParams {
  batteryAssetId: string;
  limit?: number;
}

export interface GetBatchPredictionParams {
  limit?: number;
}
