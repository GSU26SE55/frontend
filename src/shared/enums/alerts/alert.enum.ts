export const AlertSeverityEnum = {
  Info: 1,
  Warning: 2,
  Critical: 3,
} as const;
export type AlertSeverityEnum =
  (typeof AlertSeverityEnum)[keyof typeof AlertSeverityEnum];

export const AlertStatusEnum = {
  Open: 1,
  Acknowledged: 2,
  Merged: 3,
  Resolved: 4,
} as const;
export type AlertStatusEnum =
  (typeof AlertStatusEnum)[keyof typeof AlertStatusEnum];

export const AnomalyTypeEnum = {
  Overheat: 1,
  Overvoltage: 2,
  Undervoltage: 3,
  LowSoc: 4,
  RapidDischarge: 5,
  AbnormalCharging: 6,
  DeviceOffline: 7,
  SohDegradation: 8,
  HighAmbientTemp: 9,
  HighHumidity: 10,
  HighTempHumidityCombo: 11,
  HighInternalResistance: 12,
  CellImbalance: 13,
  EnvironmentalIncident: 14,
  SensorMismatch: 15,
  // Temperature < ThresholdConfig.TemperatureMin. Below TemperatureMin − 5°C → Critical.
  Undertemp: 16,
  // > 50 outlier readings in an hour → the backend decommissions the device permanently.
  // Rare, but it DOES reach the alert table, so leaving it out here made the UI render a
  // bare "#17" for a state that ends a device's life.
  IotDataIntegrityViolation: 17,
  // MQ-2 gas concentration (%) over AmbientThresholdConfig.HighGasWarning/Critical.
  // Site-level like HighAmbientTemp — reported by the gas sensor, not tied to a battery.
  HighGasConcentration: 18,
  // Water-leak sensor (rain/water-leak) reported wet — bool, no threshold, always Critical.
  // Site-level, same environmental group as HighGasConcentration/EnvironmentalIncident.
  WaterLeak: 19,
} as const;
export type AnomalyTypeEnum =
  (typeof AnomalyTypeEnum)[keyof typeof AnomalyTypeEnum];
