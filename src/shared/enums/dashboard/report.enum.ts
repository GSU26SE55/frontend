// Granularity bucket for the time-series reports (alert-volume, ambient-trend).
// The BE defaults to "day" when this is omitted.
export const ReportGranularityEnum = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;
export type ReportGranularityEnum =
  (typeof ReportGranularityEnum)[keyof typeof ReportGranularityEnum];

// Export file format. The BE only accepts csv/xlsx — anything else returns JSON
// (there is no pdf).
export const ReportFormat = {
  Csv: "csv",
  Xlsx: "xlsx",
} as const;
export type ReportFormat = (typeof ReportFormat)[keyof typeof ReportFormat];
