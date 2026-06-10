export const BatteryChemistryEnum = {
  LiFePO4: 1,
  Nmc: 2,
  Nca: 3,
  Lco: 4,
  Other: 99,
} as const;
export type BatteryChemistryEnum =
  (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];
