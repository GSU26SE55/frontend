export const EnvironmentalIncidentTypeEnum = {
  Smoke: 1,
  FireDetected: 2,
  GasLeak: 3,
  Flood: 4,
  OverheatHazard: 5,
  Other: 99,
} as const;
export type EnvironmentalIncidentTypeEnum =
  (typeof EnvironmentalIncidentTypeEnum)[keyof typeof EnvironmentalIncidentTypeEnum];

export const EnvironmentalIncidentStatusEnum = {
  Open: 1,
  Acknowledged: 2,
  Resolved: 3,
  FalseAlarm: 4,
} as const;
export type EnvironmentalIncidentStatusEnum =
  (typeof EnvironmentalIncidentStatusEnum)[keyof typeof EnvironmentalIncidentStatusEnum];
