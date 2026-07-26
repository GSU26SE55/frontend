import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";

export const INCIDENT_TYPE_LABELS: Record<
  EnvironmentalIncidentTypeEnum,
  string
> = {
  [EnvironmentalIncidentTypeEnum.Smoke]: "Khói",
  [EnvironmentalIncidentTypeEnum.FireDetected]: "Cháy",
  [EnvironmentalIncidentTypeEnum.GasLeak]: "Rò rỉ khí",
  [EnvironmentalIncidentTypeEnum.Flood]: "Ngập nước",
  [EnvironmentalIncidentTypeEnum.OverheatHazard]: "Nguy cơ quá nhiệt",
  [EnvironmentalIncidentTypeEnum.Other]: "Khác",
};

export const incidentTypeLabel = (t: EnvironmentalIncidentTypeEnum) =>
  INCIDENT_TYPE_LABELS[t] ?? `#${t}`;
