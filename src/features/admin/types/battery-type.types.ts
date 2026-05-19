export const BatteryChemistryEnum = {
  LiFePO4: 1,
  Nmc:     2,
  Nca:     3,
  Lco:     4,
  Other:   99,
} as const;
export type BatteryChemistryEnum = (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];

export interface BatteryTypeDto {
  id:                string;
  name:              string;
  manufacturer?:     string;
  nominalCapacityAh: number;
  nominalVoltage:    number;
  chemistry:         BatteryChemistryEnum;
  maxCycleCount:     number;
  description?:      string;
  createdAt:         string;
}

export interface BatteryTypeListParams {
  pageNumber?:     number;
  pageSize?:       number;
  keyword?:        string;
  includeDeleted?: boolean;
}

export interface CreateBatteryTypePayload {
  name:              string;
  manufacturer?:     string;
  nominalCapacityAh: number;
  nominalVoltage:    number;
  chemistry?:        BatteryChemistryEnum;
  maxCycleCount?:    number;
  description?:      string;
}

export type UpdateBatteryTypePayload = Required<
  Pick<CreateBatteryTypePayload, 'name' | 'nominalCapacityAh' | 'nominalVoltage'>
> & Omit<CreateBatteryTypePayload, 'name' | 'nominalCapacityAh' | 'nominalVoltage'>;
