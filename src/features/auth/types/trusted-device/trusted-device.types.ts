// #AUTH-48: Trusted Devices — response của GET /api/accounts/me/trusted-devices.
// Shape khớp BE AuthService TrustedDeviceDto.cs.
export interface TrustedDeviceDto {
  id: string; // Guid — dùng để revoke qua DELETE /me/trusted-devices/{id}
  label: string; // "Chrome on macOS" / label user nhập lúc trust
  ipPrefix: string; // subnet prefix vd "203.0.113.0/24"
  userAgentSnapshot?: string | null; // null nếu UA rỗng lúc trust — display only
  trustedAt: string; // UTC
  expiresAt: string; // UTC = trustedAt + 30 ngày
  lastUsedAt?: string | null; // null nếu chưa từng skip 2FA qua device này
  usageCount: number;
  isCurrentDevice: boolean; // true nếu device gọi API match fingerprint (cần X-Device-Id)
}
