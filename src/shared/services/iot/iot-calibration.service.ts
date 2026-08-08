// Cross-feature (admin + staff + manager) → placed in shared/ to avoid violating no-restricted-imports.
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  IotDeviceDto,
  IotDeviceCalibrationDto,
  CreateCalibrationPayload,
  CalibrationListParams,
} from "@/shared/types/iot/iot.types";

export const iotCalibrationService = {
  getList: (deviceId: string, params?: CalibrationListParams) =>
    axiosInstance.get<CommonResponse<IotDeviceCalibrationDto[]>>(
      ENDPOINTS.IOT_CALIBRATIONS.LIST(deviceId),
      { params },
    ),
  create: (deviceId: string, payload: CreateCalibrationPayload) =>
    axiosInstance.post<CommonResponse<IotDeviceCalibrationDto>>(
      ENDPOINTS.IOT_CALIBRATIONS.CREATE(deviceId),
      payload,
    ),
  delete: (deviceId: string, calibrationId: string) =>
    axiosInstance.delete<CommonResponse<null>>(
      ENDPOINTS.IOT_CALIBRATIONS.DELETE(deviceId, calibrationId),
    ),
  // within: number of days ahead (BE default 30, clamped to [1,365]).
  getExpiring: (within?: number) =>
    axiosInstance.get<CommonResponse<IotDeviceCalibrationDto[]>>(
      ENDPOINTS.IOT_CALIBRATIONS.EXPIRING,
      { params: within !== undefined ? { within } : undefined },
    ),
  // Bridge from deviceCode → deviceId (Staff reads the code printed on the device body). 404 if no match.
  lookupDeviceByCode: (deviceCode: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDto>>(
      ENDPOINTS.IOT_DEVICES.BY_CODE(deviceCode),
    ),
};
