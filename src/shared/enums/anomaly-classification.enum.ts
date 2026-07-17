// AI classification (Isolation Forest + LSTM/CNN-LSTM) — BatteryService serialize enum dạng int.
// Nguồn: docs/api-battery.md §Nhóm 14.

// Kết quả phân loại của model.
export const AnomalyClassificationEnum = {
  Normal: 1,
  Degrading: 2,
  Failed: 3,
} as const;
export type AnomalyClassificationEnum =
  (typeof AnomalyClassificationEnum)[keyof typeof AnomalyClassificationEnum];

// Đánh giá của Staff về classification — feedback loop cho retrain.
export const StaffFeedbackEnum = {
  Correct: 1,
  FalsePositive: 2,
  FalseNegative: 3,
} as const;
export type StaffFeedbackEnum =
  (typeof StaffFeedbackEnum)[keyof typeof StaffFeedbackEnum];
