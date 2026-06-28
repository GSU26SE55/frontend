import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  IotDeviceDto,
  IotDeviceCreatedDto,
  IotDeviceListParams,
  CreateIotDevicePayload,
  UpdateIotDevicePayload,
  SendCommandPayload,
  IotDeviceCommandAcceptedDto,
} from "@/shared/types/iot.types";

export const iotDeviceService = {
  getList: (params?: IotDeviceListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<IotDeviceDto>>>(
      ENDPOINTS.IOT_DEVICES.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDto>>(
      ENDPOINTS.IOT_DEVICES.DETAIL(id),
    ),
  // Trả IotDeviceCreatedDto — secrets (rawApiKey, QR, MQTT) chỉ có 1 lần.
  create: (payload: CreateIotDevicePayload) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.CREATE,
      payload,
    ),
  update: (id: string, payload: UpdateIotDevicePayload) =>
    axiosInstance.put<CommonResponse<IotDeviceDto>>(
      ENDPOINTS.IOT_DEVICES.UPDATE(id),
      payload,
    ),
  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(
      ENDPOINTS.IOT_DEVICES.DELETE(id),
    ),
  // 200 (không 201); trả IotDeviceCreatedDto với key mới, bỏ revoke, KHÔNG đổi Status.
  rotateKey: (id: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_KEY(id),
    ),
  revokeKey: (id: string) =>
    axiosInstance.post<CommonResponse<null>>(
      ENDPOINTS.IOT_DEVICES.REVOKE_KEY(id),
    ),
  sendCommand: (id: string, payload: SendCommandPayload) =>
    axiosInstance.post<CommonResponse<IotDeviceCommandAcceptedDto>>(
      ENDPOINTS.IOT_DEVICES.COMMAND(id),
      payload,
    ),
};
