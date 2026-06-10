export { BatteryChemistryEnum } from "./battery-type.enums";

import type { BatteryChemistryEnum } from "./battery-type.enums";

export interface BatteryTypeDto {
  id: string;
  name: string;
  manufacturer?: string;
  nominalCapacityAh: number;
  nominalVoltage: number;
  chemistry: BatteryChemistryEnum;
  maxCycleCount: number;
  description?: string;
  createdAt: string;
}

export interface BatteryTypeListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  includeDeleted?: boolean;
}

export interface CreateBatteryTypePayload {
  name: string;
  manufacturer?: string;
  nominalCapacityAh: number;
  nominalVoltage: number;
  chemistry?: BatteryChemistryEnum;
  maxCycleCount?: number;
  description?: string;
}

export type UpdateBatteryTypePayload = Required<
  Pick<
    CreateBatteryTypePayload,
    "name" | "nominalCapacityAh" | "nominalVoltage"
  >
> &
  Omit<
    CreateBatteryTypePayload,
    "name" | "nominalCapacityAh" | "nominalVoltage"
  >;
