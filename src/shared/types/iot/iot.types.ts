// IoT Device Management types — Group 11, BatteryService.
// Enums are imported and re-exported from shared/enums/iot.enum.ts (never
// defined inline here). Guid/DateTime from the BE become string on the FE.
import type {
  IotDeviceStatusEnum,
  IotFirmwareChannelEnum,
} from "@/shared/enums/iot/iot.enum";
export {
  IotDeviceStatusEnum,
  IotApiKeyScopeEnum,
  IotFirmwareChannelEnum,
} from "@/shared/enums/iot/iot.enum";

// ── Devices (11C) ──────────────────────────────────────────────
export interface IotDeviceDto {
  id: string;
  deviceCode: string;
  displayName: string;
  siteId: string;
  siteName: string | null;
  hardwareRevision: string | null;
  status: IotDeviceStatusEnum;
  currentFirmwareVersion: string | null;
  targetFirmwareReleaseId: string | null;
  targetFirmwareVersion: string | null;
  apiKeyScopes: number; // bitmask IotApiKeyScopeEnum — a combo (e.g. 3, 5), not an enum member
  apiKeyLastFour: string;
  apiKeyIssuedAt: string;
  apiKeyRevokedAt: string | null;
  lastSeenAt: string | null;
  lastProvisionedAt: string | null;
  lastOfflineAt: string | null;
  heartbeatIntervalSeconds: number;
  lastClockSkewSeconds: number | null;
  notes: string | null;
  createdAt: string;
}

// Returned by GET /api/admin/iot-devices/{id} — the ONLY endpoint that returns the
// full key outside of create/rotate (it can be read back any number of times, unlike
// `rawApiKey` which is returned once). The list does NOT carry this field — only
// apiKeyLastFour.
export interface IotDeviceDetailDto extends IotDeviceDto {
  // null for devices created BEFORE plaintext storage was enabled (the old DB kept
  // only the SHA-256 hash and cannot be backfilled) → use rotate-key to mint a new
  // key and store the plaintext.
  apiKey: string | null;
}

// Returned on create and rotate-key — secrets are returned only once.
export interface IotDeviceCreatedDto extends IotDeviceDto {
  rawApiKey: string;
  provisioningQrCode: string;
  // All six MQTT fields are nullable on the BE (`string?` / `int?` / `bool?`) and are all empty
  // while the bridge is off (`MqttBrokerEndpoint.Disabled`). Declaring them as `string`/`number`
  // the way we used to is a LIE: TypeScript believes a value is always present, while at runtime
  // a null `mqttBrokerPort` gets turned into the string "null" by `String()` and shows up verbatim
  // in the field the operator is meant to copy.
  mqttUsername: string | null;
  mqttPassword: string | null;
  mqttBrokerHost: string | null;
  mqttBrokerPort: number | null;
  // GH-784 — these two fields exist so whoever configures the device does NOT have to guess.
  mqttUseTls: boolean | null;
  mqttTopicPrefix: string | null;
}

export interface CreateIotDevicePayload {
  deviceCode: string;
  displayName: string;
  siteId: string;
  hardwareRevision?: string;
  apiKeyScopes?: number; // bitmask
  heartbeatIntervalSeconds?: number;
  notes?: string;
}

export interface UpdateIotDevicePayload {
  displayName: string;
  siteId: string;
  hardwareRevision?: string;
  status: IotDeviceStatusEnum;
  apiKeyScopes?: number; // bitmask
  heartbeatIntervalSeconds?: number;
  targetFirmwareReleaseId?: string;
  notes?: string;
}

export interface IotDeviceListParams {
  siteId?: string;
  status?: IotDeviceStatusEnum;
  keyword?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
  isDescending?: boolean;
}

export interface SendCommandPayload {
  cmdId?: string;
  type: string;
  params?: Record<string, unknown>;
}

export interface IotDeviceCommandAcceptedDto {
  cmdId: string;
  deviceCode: string;
  topic: string;
}

// ── Calibration (11B) ──────────────────────────────────────────
export interface IotDeviceCalibrationDto {
  id: string;
  iotDeviceId: string;
  channel: string;
  batteryAssetId: string | null;
  scale: number;
  offset: number;
  unit: string;
  calibratedAt: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateCalibrationPayload {
  channel: string;
  batteryAssetId?: string;
  scale: number;
  offset: number;
  unit: string;
  calibratedAt: string;
  expiresAt?: string;
  notes?: string;
}

export interface CalibrationListParams {
  channel?: string;
  includeExpired?: boolean;
}

// ── Firmware Releases (11D) ─────────────────────────────────────
export interface IotFirmwareReleaseDto {
  id: string;
  version: string;
  hardwareRevision: string;
  artifactUrl: string;
  sha256Checksum: string;
  artifactSizeBytes: number;
  releaseNotes: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  isArchived: boolean;
  createdAt: string;
  isRequired: boolean;
  channel: IotFirmwareChannelEnum;
  deviceModel: string | null;
}

// Returned by upload-binary — does NOT create a release, only artifact info.
export interface FirmwareBinaryUploadDto {
  artifactUrl: string;
  sha256Checksum: string;
  artifactSizeBytes: number;
  fileName: string;
  version: string;
  hardwareRevision: string;
  isRequired: boolean;
}

export interface CreateFirmwareReleasePayload {
  version: string;
  hardwareRevision: string;
  artifactUrl: string;
  sha256Checksum: string;
  artifactSizeBytes: number;
  releaseNotes?: string;
  publishImmediately?: boolean;
  isRequired?: boolean;
  channel?: IotFirmwareChannelEnum;
  deviceModel?: string;
}

// Firmware upload form (multipart) — step 1 of the 2-step create.
export interface UploadFirmwareBinaryPayload {
  file: File;
  version: string;
  hardwareRevision: string;
  isRequired?: boolean;
  channel?: IotFirmwareChannelEnum;
  releaseNotes?: string;
  deviceModel?: string;
}

export interface FirmwareReleaseListParams {
  hardwareRevision?: string;
  publishedOnly?: boolean;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}
