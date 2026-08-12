import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TrustedDeviceDto } from "@/features/auth/types/trusted-device/trusted-device.types";

// #AUTH-48: Trusted Devices. X-Device-Id is attached automatically by the axios interceptor
// → the BE marks isCurrentDevice for the calling device.
export const trustedDeviceService = {
  list: () =>
    axiosInstance.get<CommonResponse<TrustedDeviceDto[]>>(
      ENDPOINTS.ACCOUNTS.ME.TRUSTED_DEVICES,
    ),

  // revoke a single device (idempotent — calling again on an already revoked device still returns 200)
  revokeOne: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ACCOUNTS.ME.TRUSTED_DEVICE(id),
    ),

  // revoke all (data = null, the count is in the message)
  revokeAll: () =>
    axiosInstance.delete<CommonResponse<null>>(
      ENDPOINTS.ACCOUNTS.ME.TRUSTED_DEVICES,
    ),
};
