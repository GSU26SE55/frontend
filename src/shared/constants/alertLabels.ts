import {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";

export const ANOMALY_TYPE_LABELS: Record<AnomalyTypeEnum, string> = {
  [AnomalyTypeEnum.Overheat]: "Quá nhiệt",
  [AnomalyTypeEnum.Overvoltage]: "Quá áp",
  [AnomalyTypeEnum.Undervoltage]: "Sụt áp",
  [AnomalyTypeEnum.LowSoc]: "SOC thấp",
  [AnomalyTypeEnum.RapidDischarge]: "Xả nhanh",
  [AnomalyTypeEnum.AbnormalCharging]: "Nạp bất thường",
  [AnomalyTypeEnum.DeviceOffline]: "Mất kết nối",
  [AnomalyTypeEnum.SohDegradation]: "Suy giảm SOH",
  [AnomalyTypeEnum.HighAmbientTemp]: "Nhiệt độ môi trường cao",
  [AnomalyTypeEnum.HighHumidity]: "Độ ẩm cao",
  [AnomalyTypeEnum.HighTempHumidityCombo]: "Combo nhiệt độ + độ ẩm",
  [AnomalyTypeEnum.HighInternalResistance]: "Điện trở trong cao",
  [AnomalyTypeEnum.CellImbalance]: "Mất cân bằng cell",
  [AnomalyTypeEnum.EnvironmentalIncident]: "Sự cố môi trường",
  [AnomalyTypeEnum.SensorMismatch]: "Lệch cảm biến",
  [AnomalyTypeEnum.Undertemp]: "Nhiệt độ thấp",
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverityEnum, string> = {
  [AlertSeverityEnum.Info]: "Thông tin",
  [AlertSeverityEnum.Warning]: "Cảnh báo",
  [AlertSeverityEnum.Critical]: "Nguy hiểm",
};

export const ALERT_STATUS_LABELS: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: "Mở",
  [AlertStatusEnum.Acknowledged]: "Đã xác nhận",
  [AlertStatusEnum.Merged]: "Đã gộp",
  [AlertStatusEnum.Resolved]: "Đã xử lý",
};

export const anomalyTypeLabel = (t: AnomalyTypeEnum) =>
  ANOMALY_TYPE_LABELS[t] ?? `#${t}`;

export const alertSeverityLabel = (s: AlertSeverityEnum) =>
  ALERT_SEVERITY_LABELS[s] ?? `#${s}`;

export const alertStatusLabel = (s: AlertStatusEnum) =>
  ALERT_STATUS_LABELS[s] ?? `#${s}`;
