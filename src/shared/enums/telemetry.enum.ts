// Telemetry SSE enums — dùng cho LiveReadingDto (kênh realtime sensor-readings/stream).
// Nguồn: frontend/docs/battery-realtime-description.md §5.3 (sourceType) + §5.4 (sensorSourceCode).

// sourceType: nguồn số đo (LiveReadingDto.sourceType — non-null int).
export const SensorSourceTypeEnum = {
  BMS: 1,
  IoTGateway: 2,
  External: 3,
} as const;
export type SensorSourceTypeEnum =
  (typeof SensorSourceTypeEnum)[keyof typeof SensorSourceTypeEnum];

// sensorSourceCode: phân biệt đa nguồn cùng 1 pin (§5.4). Mặc định dùng `primary`.
export const SensorSourceCodeEnum = {
  PRIMARY: "primary",
  REDUNDANT: "redundant",
  EXTERNAL_TEMP: "external-temp",
} as const;
export type SensorSourceCodeEnum =
  (typeof SensorSourceCodeEnum)[keyof typeof SensorSourceCodeEnum];
