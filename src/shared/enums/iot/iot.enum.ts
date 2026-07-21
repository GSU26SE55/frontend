// IoT Device Management enums — Nhóm 11 BatteryService.
// Dùng ≥ 2 feature (admin + staff + manager) → đặt ở shared. Pattern `as const` (int values từ BE).

export const IotDeviceStatusEnum = {
  Pending: 1,
  Active: 2,
  Offline: 3,
  Disabled: 4,
  Decommissioned: 5,
} as const;
export type IotDeviceStatusEnum =
  (typeof IotDeviceStatusEnum)[keyof typeof IotDeviceStatusEnum];

// [Flags] bitmask — 1 API key per-device có thể mang nhiều scope đồng thời.
export const IotApiKeyScopeEnum = {
  None: 0,
  SensorIngest: 1,
  DeviceHeartbeat: 2,
  EnvironmentalIngest: 4,
  FirmwareCheck: 8,
  EdgeDeviceDefault: 11, // SensorIngest | DeviceHeartbeat | FirmwareCheck (1+2+8)
} as const;
export type IotApiKeyScopeEnum =
  (typeof IotApiKeyScopeEnum)[keyof typeof IotApiKeyScopeEnum];

export const IotFirmwareChannelEnum = {
  Stable: 1,
  Beta: 2,
} as const;
export type IotFirmwareChannelEnum =
  (typeof IotFirmwareChannelEnum)[keyof typeof IotFirmwareChannelEnum];

// Bitmask helpers cho ApiKeyScopesField (render checkbox per flag).
// Chỉ thao tác trên các flag nguyên tử (1/2/4/8) — bỏ qua None(0) và bundle EdgeDeviceDefault(11).
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

// Command `type` là string tự do ở BE — gợi ý các loại phổ biến cho dropdown (+ cho phép nhập custom).
export const IOT_COMMAND_TYPES = [
  "reboot",
  "ota",
  "sample-now",
  "calibrate",
  "set-config",
] as const;
