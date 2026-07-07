// Helper sức khỏe site (client-side) — dùng cho danh sách/at-risk site ở dashboard.
// Aggregate KPI (activeCount/avgHealth/atRiskCount) lấy từ /api/sites/dashboard/stats.

/** Health % của 1 site = activeBatteryAssetCount / batteryAssetCount × 100. */
export function siteHealth(s: {
  batteryAssetCount: number;
  activeBatteryAssetCount: number;
}): number {
  return s.batteryAssetCount > 0
    ? Math.round((s.activeBatteryAssetCount / s.batteryAssetCount) * 100)
    : 100;
}

/** Màu theo health %: >=80 ok · >=60 p3 · còn lại p1 */
export function healthColor(h: number): string {
  return h >= 80 ? "var(--ok)" : h >= 60 ? "var(--p3)" : "var(--p1)";
}
