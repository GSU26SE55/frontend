// Client-side site health helpers — used by the dashboard's site list / at-risk list.
// The aggregate KPIs (activeCount/avgHealth/atRiskCount) come from /api/sites/dashboard/stats.

/** Health % of one site = activeBatteryAssetCount / batteryAssetCount × 100. */
export function siteHealth(s: {
  batteryAssetCount: number;
  activeBatteryAssetCount: number;
}): number {
  return s.batteryAssetCount > 0
    ? Math.round((s.activeBatteryAssetCount / s.batteryAssetCount) * 100)
    : 100;
}

/** Color by health %: >=80 ok · >=60 p3 · anything else p1 */
export function healthColor(h: number): string {
  return h >= 80 ? "var(--ok)" : h >= 60 ? "var(--p3)" : "var(--p1)";
}
