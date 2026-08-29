import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import {
  CascadeRiskLevel,
  ElectricalTopologyEnum,
} from "@/shared/enums/battery/cascade.enum";
import type {
  CascadeRiskDto,
  CascadeRiskLevelName,
  ElectricalTopologyName,
  RawCascadeRiskDto,
  RawEnum,
  RawSiteCascadeRiskSummaryDto,
  SiteCascadeRiskSummaryDto,
  SetTopologyPayload,
} from "@/shared/types/battery/cascade.types";

// The cascade endpoints send `level` and `electricalTopology` as the NUMERIC enum value, not
// the string name the DTO advertises. Every consumer keys off the name — the tone map in
// statusColors, LEVEL_LABEL in CascadeRiskCard, and the `level === "High"` interlock in
// BmsSwitchControlCard — so an unconverted number silently misses every lookup: the badge
// renders "Cascade risk: 1", High risk paints the neutral fallback colour, and the BMS
// high-risk guard never trips. Normalising once here keeps that fix in a single place rather
// than in each component.
const nameFrom = <T extends Record<string, number>>(
  lookup: T,
  value: RawEnum<Extract<keyof T, string>>,
): Extract<keyof T, string> => {
  if (typeof value === "string") return value;
  const entry = Object.entries(lookup).find(([, v]) => v === value);
  // An unmapped number would break the lookups above just as badly as the raw value, so fall
  // back to the lowest level rather than casting a number through as if it were a name.
  return (entry?.[0] ?? Object.keys(lookup)[0]) as Extract<keyof T, string>;
};

const normalizeCascadeRisk = (dto?: RawCascadeRiskDto) =>
  dto &&
  ({
    ...dto,
    level: nameFrom(CascadeRiskLevel, dto.level) as CascadeRiskLevelName,
    electricalTopology: nameFrom(
      ElectricalTopologyEnum,
      dto.electricalTopology,
    ) as ElectricalTopologyName,
  } satisfies CascadeRiskDto);

const normalizeSiteSummary = (dto?: RawSiteCascadeRiskSummaryDto) =>
  dto &&
  ({
    ...dto,
    highRiskAssets: (dto.highRiskAssets ?? [])
      .map(normalizeCascadeRisk)
      .filter((a): a is CascadeRiskDto => !!a),
  } satisfies SiteCascadeRiskSummaryDto);

// getAssetRisk (Admin, Manager, Staff, Customer) + getSiteSummary (Admin, Manager).
// setTopology is Admin only — component calls it via the canManageTopology flag.
export const cascadeService = {
  getAssetRisk: async (id: string) => {
    const res = await axiosInstance.get<CommonResponse<RawCascadeRiskDto>>(
      ENDPOINTS.BATTERY_ASSETS.CASCADE_RISK(id),
    );
    return {
      ...res,
      data: { ...res.data, data: normalizeCascadeRisk(res.data.data) },
    };
  },
  getSiteSummary: async (id: string) => {
    const res = await axiosInstance.get<
      CommonResponse<RawSiteCascadeRiskSummaryDto>
    >(ENDPOINTS.SITES.CASCADE_RISK_SUMMARY(id));
    return {
      ...res,
      data: { ...res.data, data: normalizeSiteSummary(res.data.data) },
    };
  },
  setTopology: async (id: string, payload: SetTopologyPayload) => {
    const res = await axiosInstance.post<CommonResponse<RawCascadeRiskDto>>(
      ENDPOINTS.BATTERY_ASSETS.TOPOLOGY(id),
      payload,
    );
    return {
      ...res,
      data: { ...res.data, data: normalizeCascadeRisk(res.data.data) },
    };
  },
};
