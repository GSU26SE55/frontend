export const AmbientReadingSourceEnum = {
  IotSensor: 1,
  WeatherApi: 2,
} as const;
export type AmbientReadingSourceEnum =
  (typeof AmbientReadingSourceEnum)[keyof typeof AmbientReadingSourceEnum];
