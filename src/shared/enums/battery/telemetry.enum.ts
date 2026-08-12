// Telemetry SSE enums — used by LiveReadingDto (the realtime sensor-readings/stream channel).
// Source: frontend/docs/battery-realtime-description.md §5.3 (sourceType) + §5.4
// (sensorSourceCode).

// sourceType: where the reading came from (LiveReadingDto.sourceType — non-null int).
export const SensorSourceTypeEnum = {
  BMS: 1,
  IoTGateway: 2,
  External: 3,
} as const;
export type SensorSourceTypeEnum =
  (typeof SensorSourceTypeEnum)[keyof typeof SensorSourceTypeEnum];

// sensorSourceCode: tells apart multiple sources on the same battery (§5.4).
// Defaults to `primary`.
export const SensorSourceCodeEnum = {
  PRIMARY: "primary",
  REDUNDANT: "redundant",
  EXTERNAL_TEMP: "external-temp",
} as const;
export type SensorSourceCodeEnum =
  (typeof SensorSourceCodeEnum)[keyof typeof SensorSourceCodeEnum];
