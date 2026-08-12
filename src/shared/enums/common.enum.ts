export const TrendDir = {
  Up: "up",
  Down: "down",
  Flat: "flat",
} as const;
export type TrendDir = (typeof TrendDir)[keyof typeof TrendDir];
