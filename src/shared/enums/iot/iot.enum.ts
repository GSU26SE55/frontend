// IoT Device Management enums — BatteryService Group 11.
// Used by ≥ 2 features (admin + staff + manager) → lives in shared. `as const` pattern
// (int values from the BE).

export const IotDeviceStatusEnum = {
  Pending: 1,
  Active: 2,
  Offline: 3,
  Disabled: 4,
  Decommissioned: 5,
} as const;
export type IotDeviceStatusEnum =
  (typeof IotDeviceStatusEnum)[keyof typeof IotDeviceStatusEnum];

// [Flags] bitmask — a single per-device API key can carry several scopes at once.
export const IotApiKeyScopeEnum = {
  None: 0,
  SensorIngest: 1,
  DeviceHeartbeat: 2,
  EnvironmentalIngest: 4,
  FirmwareCheck: 8,
  // GH-785 — 15 = SensorIngest | DeviceHeartbeat | EnvironmentalIngest | FirmwareCheck (1+2+4+8).
  // This used to be 11 (missing EnvironmentalIngest=4), matching the BE's old value. The ESP32
  // firmware ships with environmental sensors and starts pushing readings on its very first boot,
  // so a default set missing that scope got the device's own data blocked with a 403. Devices
  // created from the Admin screen hit exactly the same problem whenever this constant drifts
  // from the BE.
  EdgeDeviceDefault: 15,
} as const;
export type IotApiKeyScopeEnum =
  (typeof IotApiKeyScopeEnum)[keyof typeof IotApiKeyScopeEnum];

export const IotFirmwareChannelEnum = {
  Stable: 1,
  Beta: 2,
} as const;
export type IotFirmwareChannelEnum =
  (typeof IotFirmwareChannelEnum)[keyof typeof IotFirmwareChannelEnum];

// Bitmask helpers for ApiKeyScopesField (renders a checkbox per flag).
// Only operates on the atomic flags (1/2/4/8) — skips None(0) and the EdgeDeviceDefault(11)
// bundle.
export const IOT_API_KEY_SCOPE_FLAGS = [
  IotApiKeyScopeEnum.SensorIngest,
  IotApiKeyScopeEnum.DeviceHeartbeat,
  IotApiKeyScopeEnum.EnvironmentalIngest,
  IotApiKeyScopeEnum.FirmwareCheck,
] as const;

export function hasScope(value: number, flag: number): boolean {
  return (value & flag) === flag;
}

export function toggleScope(value: number, flag: number): number {
  return hasScope(value, flag) ? value & ~flag : value | flag;
}

/**
 * Ba loại lệnh mà FIRMWARE thật sự hiểu — nguồn: `iot/firmware-esp32/src/cmd/cmd_logic.cpp`
 * (`classifyType`, dòng 33–39). Firmware chấp cả biến thể gạch dưới lẫn gạch ngang
 * (`set_interval` = `set-interval`), ở đây dùng gạch dưới cho khớp mã nguồn.
 *
 * ⚠️ Danh sách CŨ (`reboot` · `ota` · `sample-now` · `calibrate` · `set-config`) **KHÔNG có loại
 * nào firmware hiểu**. Nó chép từ XML doc của `IotDeviceCommandPayloadDto`, mà doc đó chưa bao giờ
 * khớp firmware. Hậu quả đo được 08/08/2026: Admin chọn `reboot` → backend trả 202 → thiết bị nhận
 * đúng topic → trả ack `status: "unknown"` → **không ai thấy**, vì ack chỉ vào log backend.
 * Mọi tầng báo thành công, việc thì không xảy ra.
 *
 * Sửa danh sách này phải đối chiếu `classifyType` trước, đừng lấy từ tài liệu.
 */
export const IOT_COMMAND_TYPES = [
  "set_interval",
  "trigger_ota",
  "request_heartbeat",
] as const;
export type IotCommandType = (typeof IOT_COMMAND_TYPES)[number];

/**
 * Dải hợp lệ của `pollingSeconds`. Khớp `kPollingMinSec` / `kPollingMaxSec` trong
 * `iot/firmware-esp32/src/cmd/cmd_logic.h`.
 *
 * Ngoài dải này firmware ack `status: "failed"` kèm `error: "pollingSeconds out of range"` —
 * backend KHÔNG chặn (nó chỉ chuyển tiếp JSON), nên chặn ở form là chốt duy nhất người dùng
 * nhận được phản hồi ngay thay vì phải đi đọc log.
 */
export const POLLING_SECONDS_MIN = 1;
export const POLLING_SECONDS_MAX = 3600;

/** Vài mức dùng thường xuyên — bấm một cái thay vì gõ số. Vẫn nhập tay được giá trị khác. */
export const POLLING_PRESETS = [
  { seconds: 1, label: "1 second" },
  { seconds: 5, label: "5 seconds" },
  { seconds: 10, label: "10 seconds" },
  { seconds: 30, label: "30 seconds" },
  { seconds: 60, label: "1 minute" },
  { seconds: 300, label: "5 minutes" },
] as const;

/**
 * Mô tả từng lệnh bằng tiếng người, cho form chọn lệnh.
 *
 * `effect` là điều người bấm nút CẦN biết trước khi bấm mà nhìn tên lệnh không đoán ra — mỗi dòng
 * dưới đây đều đọc ra từ mã firmware, không phải từ tài liệu:
 *   • set_interval      — `main.cpp:672` chỉ gán vào RAM, không hề gọi `nvsPutInt32` ⇒ mất khi reboot.
 *   • request_heartbeat — `heartbeat.cpp:105` gửi bằng `httpPostJson`, tức HTTPS chứ không phải MQTT.
 *   • trigger_ota       — `ota_update.cpp:517` từ chối khi OTA tắt hoặc đang xác minh bản vừa nạp.
 */
export const IOT_COMMAND_META: Record<
  IotCommandType,
  { label: string; description: string; effect: string }
> = {
  set_interval: {
    label: "Change sampling interval",
    description:
      "The device measures and reports data more or less frequently.",
    effect:
      "Takes effect immediately but is lost when the device reboots — the firmware keeps it in RAM only and never writes it to internal storage. To change it permanently, edit the configuration and re-provision the device.",
  },
  trigger_ota: {
    label: "Check for new firmware now",
    description:
      "The device asks the server for an update instead of waiting for the schedule.",
    effect:
      "Rejected if OTA is disabled on the device or the device is still verifying a freshly flashed build — in that case the device returns the exact reason.",
  },
  request_heartbeat: {
    label: "Request a health report now",
    description: "No need to wait for the next scheduled report.",
    effect:
      "The device sends the report over HTTPS rather than MQTT. So if the HTTPS path is broken, the command fails even when MQTT is healthy.",
  },
};
