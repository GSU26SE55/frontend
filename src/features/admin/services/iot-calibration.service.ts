import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  IotDeviceCalibrationDto,
  CreateCalibrationPayload,
  CalibrationListParams,
} from "@/shared/types/iot.types";

export const iotCalibrationService = {
  getList: (deviceId: string, params?: CalibrationListParams) =>
    axiosInstance.get<CommonResponse<IotDeviceCalibrationDto[]>>(
      ENDPOINTS.IOT_CALIBRATIONS.LIST(deviceId),
      { params },
    ),

  getExpiring: (within?: number) =>
    axiosInstance.get<CommonResponse<IotDeviceCalibrationDto[]>>(
      ENDPOINTS.IOT_CALIBRATIONS.EXPIRING,
      { params: within != null ? { within } : undefined },
    ),

  create: (deviceId: string, payload: CreateCalibrationPayload) =>
    axiosInstance.post<CommonResponse<IotDeviceCalibrationDto>>(
      ENDPOINTS.IOT_CALIBRATIONS.CREATE(deviceId),
      payload,
    ),

  remove: (deviceId: string, calibrationId: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.IOT_CALIBRATIONS.DELETE(deviceId, calibrationId),
    ),
};
