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

// Command `type` is a free-form string on the BE — these are the common types suggested in
// the dropdown (custom entries are still allowed).
export const IOT_COMMAND_TYPES = [
  "reboot",
  "ota",
  "sample-now",
  "calibrate",
  "set-config",
] as const;
