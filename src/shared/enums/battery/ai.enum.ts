// BE-AI — enums mirroring the BE (AnomalyClassificationEnum, StaffFeedbackEnum).
// `as const` pattern. Shared by admin/manager/staff → lives in shared/enums/battery.

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
  [AnomalyClassificationEnum.Normal]: "Normal",
  [AnomalyClassificationEnum.Degrading]: "Degrading",
  [AnomalyClassificationEnum.Failed]: "Failed / EOL",
};

export const StaffFeedbackEnum = {
  Correct: 1,
  FalsePositive: 2,
  FalseNegative: 3,
} as const;
export type StaffFeedbackEnum =
  (typeof StaffFeedbackEnum)[keyof typeof StaffFeedbackEnum];

export const StaffFeedbackLabel: Record<StaffFeedbackEnum, string> = {
  [StaffFeedbackEnum.Correct]: "AI was right",
  [StaffFeedbackEnum.FalsePositive]: "False alarm (actually normal)",
  [StaffFeedbackEnum.FalseNegative]: "Missed anomaly",
};
