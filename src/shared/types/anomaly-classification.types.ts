// AI classification — kết quả model lưu ở bảng riêng `anomaly_classifications`
// (không nhét vào Alerts) để giữ bằng chứng model chạy thật + feedback loop retrain.
// Nguồn: docs/api-battery.md §Nhóm 14.
//
// ⚠️ BE hiện CHỈ có POST /{id}/feedback — không có GET list/detail, và không DTO nào
// expose classificationId. Data layer này sẵn sàng cho Sprint AI; UI feedback chưa
// implement được cho tới khi BE bổ sung GET endpoint.

import type {
  AnomalyClassificationEnum,
  StaffFeedbackEnum,
} from "@/shared/enums/anomaly-classification.enum";
export {
  AnomalyClassificationEnum,
  StaffFeedbackEnum,
} from "@/shared/enums/anomaly-classification.enum";

export interface AnomalyClassificationDto {
  id: string;
  alertId: string | null; // null nếu classify không gắn Alert cụ thể
  batteryAssetId: string;
  classification: AnomalyClassificationEnum;
  anomalyScore: number; // Isolation Forest — âm = bất thường hơn
  confidence: number; // 0–1
  modelVersion: string; // "1.0" / "1.1" — khớp artifact versioning
  classifiedAt: string; // ISO UTC
  latencyMs: number; // monitor SLA inference < 100ms
  staffFeedback: StaffFeedbackEnum | null;
  staffFeedbackByUserId: string | null;
  staffFeedbackAt: string | null;
}

// POST /api/v1/anomaly-classifications/{id}/feedback — body.
// `staffFeedbackByUserId` BE lấy từ token, client KHÔNG set được (chống mạo danh).
export interface SubmitFeedbackPayload {
  feedback: StaffFeedbackEnum;
}
