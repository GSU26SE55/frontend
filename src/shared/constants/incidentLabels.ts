import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";

export const INCIDENT_TYPE_LABELS: Record<
  EnvironmentalIncidentTypeEnum,
  string
> = {
  [EnvironmentalIncidentTypeEnum.Smoke]: "Smoke",
  [EnvironmentalIncidentTypeEnum.FireDetected]: "Fire",
  [EnvironmentalIncidentTypeEnum.GasLeak]: "Gas leak",
  [EnvironmentalIncidentTypeEnum.Flood]: "Flooding",
  [EnvironmentalIncidentTypeEnum.OverheatHazard]: "Overheating hazard",
  [EnvironmentalIncidentTypeEnum.Other]: "Other",
};

export const incidentTypeLabel = (t: EnvironmentalIncidentTypeEnum) =>
  INCIDENT_TYPE_LABELS[t] ?? `#${t}`;
