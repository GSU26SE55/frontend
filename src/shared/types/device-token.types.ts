import type { DevicePlatformEnum } from "@/shared/enums/notification.enum";
export { DevicePlatformEnum } from "@/shared/enums/notification.enum";

export interface DeviceTokenDto {
  id: string;
  platform: DevicePlatformEnum;
  deviceInfo?: string | null;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface RegisterDeviceTokenPayload {
  token: string;
  platform: DevicePlatformEnum;
  deviceInfo?: string;
}

export interface UnregisterDeviceTokenPayload {
  token: string;
}
