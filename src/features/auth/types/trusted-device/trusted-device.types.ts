// #AUTH-48: Trusted Devices — response of GET /api/accounts/me/trusted-devices.
// Shape matches the BE AuthService TrustedDeviceDto.cs.
export interface TrustedDeviceDto {
  id: string; // Guid — used to revoke via DELETE /me/trusted-devices/{id}
  label: string; // "Chrome on macOS" / the label the user entered when trusting
  ipPrefix: string; // subnet prefix e.g. "203.0.113.0/24"
  userAgentSnapshot?: string | null; // null if the UA was empty when trusting — display only
  trustedAt: string; // UTC
  expiresAt: string; // UTC = trustedAt + 30 days
  lastUsedAt?: string | null; // null if 2FA has never been skipped through this device
  usageCount: number;
  isCurrentDevice: boolean; // true if the calling device matches the fingerprint (needs X-Device-Id)
}
