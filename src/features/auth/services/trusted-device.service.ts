import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TrustedDeviceDto } from "@/features/auth/types/trusted-device.types";

// #AUTH-48: Trusted Devices. X-Device-Id được attach tự động qua axios interceptor
// → BE đánh dấu isCurrentDevice cho device đang gọi.
export const trustedDeviceService = {
  list: () =>
    axiosInstance.get<CommonResponse<TrustedDeviceDto[]>>(
      ENDPOINTS.ACCOUNTS.ME.TRUSTED_DEVICES,
    ),

  // revoke 1 device (idempotent — gọi lại trên device đã revoke vẫn 200)
  revokeOne: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ACCOUNTS.ME.TRUSTED_DEVICE(id),
    ),

  // revoke toàn bộ (data = null, count nằm trong message)
  revokeAll: () =>
    axiosInstance.delete<CommonResponse<null>>(
      ENDPOINTS.ACCOUNTS.ME.TRUSTED_DEVICES,
    ),
};
