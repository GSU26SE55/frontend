// SMS Gateway (admin) — DTOs + payloads. Field names verified against the BE `GatewayDeviceDto` record.

export interface GatewayDeviceDto {
  id: string;
  deviceName: string;
  deviceCode: string;
  isActive: boolean;
  revokedAt: string | null;
  dailyLimit: number;
  sentToday: number;
  sentTodayDate: string | null; // DateOnly → "yyyy-MM-dd"
  lastSeenAt: string | null; // used to compute the online badge (< 10 minutes)
  lastSeenIp: string | null;
  createdAt: string;
}

// Response of POST /devices — contains the plaintext apiKey, DISPLAYED ONLY ONCE.
export type CreateGatewayDeviceResponseDto = Pick<
  GatewayDeviceDto,
  "id" | "deviceCode"
> & { apiKey: string };

// FE ALWAYS sends dailyLimit (default 100) — BE rejects < 1 and it's a non-nullable int.
export type CreateGatewayDevicePayload = Pick<
  GatewayDeviceDto,
  "deviceName" | "deviceCode" | "dailyLimit"
>;

export interface GetDevicesParams {
  includeRevoked?: boolean;
}
