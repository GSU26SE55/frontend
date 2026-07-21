import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  GatewayDeviceDto,
  CreateGatewayDeviceResponseDto,
  CreateGatewayDevicePayload,
  GetDevicesParams,
} from "@/features/admin/types/ticket/sms-gateway.types";

export const adminSmsGatewayService = {
  getDevices: (params?: GetDevicesParams) =>
    axiosInstance.get<CommonResponse<GatewayDeviceDto[]>>(
      ENDPOINTS.ADMIN.SMS_GATEWAY.DEVICES,
      { params },
    ),

  createDevice: (payload: CreateGatewayDevicePayload) =>
    axiosInstance.post<CommonResponse<CreateGatewayDeviceResponseDto>>(
      ENDPOINTS.ADMIN.SMS_GATEWAY.DEVICES,
      payload,
    ),

  revokeDevice: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ADMIN.SMS_GATEWAY.DEVICE_REVOKE(id),
    ),
};
