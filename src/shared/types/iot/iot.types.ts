// IoT Device Management types — Nhóm 11 BatteryService.
// Import + re-export enum từ shared/enums/iot.enum.ts (không define enum inline).
// Guid/DateTime từ BE → string ở FE.
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
  apiKeyScopes: number; // bitmask IotApiKeyScopeEnum — combo (vd 3, 5) không phải member enum
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

// Trả bởi GET /api/admin/iot-devices/{id} — endpoint DUY NHẤT trả full key ngoài
// lúc create/rotate (xem lại được nhiều lần, khác `rawApiKey` chỉ trả 1 lần).
// List KHÔNG có field này — chỉ có apiKeyLastFour.
export interface IotDeviceDetailDto extends IotDeviceDto {
  // null với device tạo TRƯỚC khi bật lưu plaintext (DB cũ chỉ giữ hash SHA-256,
  // không backfill được) → rotate-key để sinh key mới + lưu plaintext.
  apiKey: string | null;
}

// Trả khi create + rotate-key — secrets chỉ trả 1 lần.
export interface IotDeviceCreatedDto extends IotDeviceDto {
  rawApiKey: string;
  provisioningQrCode: string;
  // Cả sáu trường MQTT đều nullable ở BE (`string?` / `int?` / `bool?`) và cùng rỗng khi bridge
  // chưa bật (`MqttBrokerEndpoint.Disabled`). Khai `string`/`number` như trước là kiểu NÓI DỐI:
  // TypeScript tin là luôn có giá trị, còn lúc chạy thì `mqttBrokerPort` null bị `String()` biến
  // thành chuỗi "null" và hiện nguyên si trong ô cho người vận hành copy.
  mqttUsername: string | null;
  mqttPassword: string | null;
  mqttBrokerHost: string | null;
  mqttBrokerPort: number | null;
  // GH-784 — hai trường này tồn tại để người cấu hình thiết bị KHỎI phải suy đoán.
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

// Trả từ upload-binary — KHÔNG tạo release, chỉ artifact info.
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

// Form upload firmware (multipart) — bước 1 của 2-step create.
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
