import type { AmbientReadingSourceEnum } from "@/shared/enums/ambient/ambient.enum";

export { AmbientReadingSourceEnum } from "@/shared/enums/ambient/ambient.enum";

export interface AmbientReadingDto {
  time: string;
  siteId: string;
  ambientTemperature: number;
  humidity?: number | null;
  solarIrradiance?: number | null;
  source: AmbientReadingSourceEnum;
  sourceDeviceId?: string | null;
}

export interface AmbientThresholdConfigDto {
  id: string;
  siteId: string;
  highAmbientTempWarning?: number | null;
  highAmbientTempCritical?: number | null;
  highHumidityWarning?: number | null;
  highHumidityCritical?: number | null;
  comboTempThreshold?: number | null;
  comboHumidityThreshold?: number | null;
  enabled: boolean;
  createdAt: string;
}

export interface AmbientHistoryParams {
  siteId: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AmbientThresholdListParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface AmbientThresholdUpsertPayload {
  siteId: string;
  highAmbientTempWarning?: number | null;
  highAmbientTempCritical?: number | null;
  highHumidityWarning?: number | null;
  highHumidityCritical?: number | null;
  comboTempThreshold?: number | null;
  comboHumidityThreshold?: number | null;
  enabled?: boolean;
}
