import {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";

export const ANOMALY_TYPE_LABELS: Record<AnomalyTypeEnum, string> = {
  [AnomalyTypeEnum.Overheat]: "Overheating",
  [AnomalyTypeEnum.Overvoltage]: "Overvoltage",
  [AnomalyTypeEnum.Undervoltage]: "Undervoltage",
  [AnomalyTypeEnum.LowSoc]: "Low SOC",
  [AnomalyTypeEnum.RapidDischarge]: "Rapid discharge",
  [AnomalyTypeEnum.AbnormalCharging]: "Abnormal charging",
  [AnomalyTypeEnum.DeviceOffline]: "Connection lost",
  [AnomalyTypeEnum.SohDegradation]: "SOH degradation",
  [AnomalyTypeEnum.HighAmbientTemp]: "High ambient temperature",
  [AnomalyTypeEnum.HighHumidity]: "High humidity",
  [AnomalyTypeEnum.HighTempHumidityCombo]: "Temperature + humidity combo",
  [AnomalyTypeEnum.HighInternalResistance]: "High internal resistance",
  [AnomalyTypeEnum.CellImbalance]: "Cell imbalance",
  [AnomalyTypeEnum.EnvironmentalIncident]: "Environmental incident",
  [AnomalyTypeEnum.SensorMismatch]: "Sensor mismatch",
  [AnomalyTypeEnum.Undertemp]: "Low temperature",
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverityEnum, string> = {
  [AlertSeverityEnum.Info]: "Info",
  [AlertSeverityEnum.Warning]: "Warning",
  [AlertSeverityEnum.Critical]: "Critical",
};

export const ALERT_STATUS_LABELS: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: "Open",
  [AlertStatusEnum.Acknowledged]: "Acknowledged",
  [AlertStatusEnum.Merged]: "Merged",
  [AlertStatusEnum.Resolved]: "Resolved",
};

export const anomalyTypeLabel = (t: AnomalyTypeEnum) =>
  ANOMALY_TYPE_LABELS[t] ?? `#${t}`;

export const alertSeverityLabel = (s: AlertSeverityEnum) =>
  ALERT_SEVERITY_LABELS[s] ?? `#${s}`;

export const alertStatusLabel = (s: AlertStatusEnum) =>
  ALERT_STATUS_LABELS[s] ?? `#${s}`;
