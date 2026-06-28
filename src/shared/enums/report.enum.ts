// Granularity bucket cho các report time-series (alert-volume, ambient-trend).
// Mặc định BE = "day" nếu bỏ trống.
export const ReportGranularityEnum = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;
export type ReportGranularityEnum =
  (typeof ReportGranularityEnum)[keyof typeof ReportGranularityEnum];

// Định dạng export file. BE chỉ nhận csv/xlsx — giá trị khác → trả JSON (không có pdf).
export const ReportFormat = {
  Csv: "csv",
  Xlsx: "xlsx",
} as const;
export type ReportFormat = (typeof ReportFormat)[keyof typeof ReportFormat];
