// BE-AI — enum khớp BE (AnomalyClassificationEnum, StaffFeedbackEnum). Pattern `as const`.
// Dùng chung admin/manager/staff → đặt ở shared/enums/battery.

export const AnomalyClassificationEnum = {
  Normal: 1,
  Degrading: 2,
  Failed: 3,
} as const;
export type AnomalyClassificationEnum =
  (typeof AnomalyClassificationEnum)[keyof typeof AnomalyClassificationEnum];

export const AnomalyClassificationLabel: Record<
  AnomalyClassificationEnum,
  string
> = {
  [AnomalyClassificationEnum.Normal]: "Bình thường",
  [AnomalyClassificationEnum.Degrading]: "Đang suy giảm",
  [AnomalyClassificationEnum.Failed]: "Hỏng / EOL",
};

export const StaffFeedbackEnum = {
  Correct: 1,
  FalsePositive: 2,
  FalseNegative: 3,
} as const;
export type StaffFeedbackEnum =
  (typeof StaffFeedbackEnum)[keyof typeof StaffFeedbackEnum];

export const StaffFeedbackLabel: Record<StaffFeedbackEnum, string> = {
  [StaffFeedbackEnum.Correct]: "AI đúng",
  [StaffFeedbackEnum.FalsePositive]: "Báo nhầm (thực tế bình thường)",
  [StaffFeedbackEnum.FalseNegative]: "Bỏ sót bất thường",
};
