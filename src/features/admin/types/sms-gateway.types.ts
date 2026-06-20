// SMS Gateway (admin) — DTOs + payloads. Field names verify từ BE `GatewayDeviceDto` record.

export interface GatewayDeviceDto {
  id: string;
  deviceName: string;
  deviceCode: string;
  isActive: boolean;
  revokedAt: string | null;
  dailyLimit: number;
  sentToday: number;
  sentTodayDate: string | null; // DateOnly → "yyyy-MM-dd"
  lastSeenAt: string | null; // dùng tính badge online (< 10 phút)
  lastSeenIp: string | null;
  createdAt: string;
}

// Response của POST /devices — chứa apiKey plaintext HIỂN THỊ 1 LẦN DUY NHẤT.
export interface CreateGatewayDeviceResponseDto {
  id: string;
  deviceCode: string;
  apiKey: string;
}

// FE LUÔN gửi dailyLimit (default 100) — BE chặn < 1 và là non-nullable int.
export interface CreateGatewayDevicePayload {
  deviceName: string;
  deviceCode: string;
  dailyLimit: number;
}

export interface GetDevicesParams {
  includeRevoked?: boolean;
}
