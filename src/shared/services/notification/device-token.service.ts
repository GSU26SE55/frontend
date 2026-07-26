import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  DeviceTokenDto,
  RegisterDeviceTokenPayload,
  UnregisterDeviceTokenPayload,
} from "@/shared/types/notification/device-token.types";

export const deviceTokenService = {
  getList: () =>
    axiosInstance.get<CommonResponse<DeviceTokenDto[]>>(
      ENDPOINTS.DEVICE_TOKENS.LIST,
    ),

  register: (payload: RegisterDeviceTokenPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.DEVICE_TOKENS.REGISTER,
      payload,
    ),

  // DELETE mang body { token } → truyền qua config.data
  unregister: (payload: UnregisterDeviceTokenPayload) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.DEVICE_TOKENS.UNREGISTER,
      { data: payload },
    ),
};
