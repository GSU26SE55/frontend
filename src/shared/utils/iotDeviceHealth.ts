/**
 * IOT3-66/67 — cách đọc "sức khoẻ" của một thiết bị IoT thành chữ người dùng hiểu được.
 *
 * Đặt ở `shared/utils` vì cả trang danh sách lẫn trang chi tiết đều dùng — và vì các NGƯỠNG
 * dưới đây phải chỉ có một bản: hai nơi cùng vẽ "sóng yếu" theo hai mốc khác nhau thì người
 * trực ca sẽ thấy cùng một thiết bị lúc vàng lúc đỏ tuỳ trang đang mở.
 */

/** "3 phút trước" đọc nhanh hơn hẳn một mốc ISO khi đang trực. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "chưa từng";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diffSec = Math.round((Date.now() - t) / 1000);
  // Đồng hồ máy trạm lệch sẽ ra số âm — đừng hiện "-5 phút trước".
  if (diffSec < 0) return "vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return `${Math.floor(diffSec / 86400)} ngày trước`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
  return `${Math.floor(seconds / 86400)} ngày`;
}

/**
 * Ngưỡng sóng WiFi.
 *
 * −75 dBm là ranh giới thực dụng: trên mức đó TCP/TLS ổn định; dưới mức đó thiết bị vẫn nối
 * được lúc thử nhưng rớt lai rai khi có người đi qua hoặc lò vi sóng chạy — và triệu chứng
 * ngoài hiện trường chỉ là "thỉnh thoảng mất dữ liệu".
 *
 * Khớp `core::kWeakRssiDbm` bên firmware; đổi một bên mà quên bên kia là app và thiết bị nói
 * hai chuyện khác nhau về cùng một con số.
 */
export const WEAK_RSSI_DBM = -75;
export const GOOD_RSSI_DBM = -60;

export type HealthTone = "good" | "warn" | "bad" | "muted";

export function rssiTone(rssi: number | null | undefined): HealthTone {
  if (rssi === null || rssi === undefined) return "muted";
  if (rssi >= GOOD_RSSI_DBM) return "good";
  if (rssi >= WEAK_RSSI_DBM) return "warn";
  return "bad";
}

/**
 * Lệch đồng hồ: vượt ±300 giây là backend TỪ CHỐI provision (§52.3).
 * Cảnh báo từ 120 giây — chạm ngưỡng rồi thì thiết bị đã ngừng hoạt động và người dùng chỉ
 * thấy nó "im lặng" mà không có manh mối nào.
 */
export const CLOCK_SKEW_REJECT_SECONDS = 300;
export const CLOCK_SKEW_WARN_SECONDS = 120;

export function clockSkewTone(seconds: number | null | undefined): HealthTone {
  if (seconds === null || seconds === undefined) return "muted";
  const abs = Math.abs(seconds);
  if (abs >= CLOCK_SKEW_REJECT_SECONDS) return "bad";
  if (abs >= CLOCK_SKEW_WARN_SECONDS) return "warn";
  return "good";
}

export function toneTextClass(tone: HealthTone): string {
  switch (tone) {
    case "good":
      return "text-emerald-600";
    case "warn":
      return "text-amber-600";
    case "bad":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}
