import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  IotDeviceDto,
  IotDeviceDetailDto,
  IotDeviceCreatedDto,
  IotDeviceListParams,
  CreateIotDevicePayload,
  UpdateIotDevicePayload,
  SendCommandPayload,
  IotDeviceCommandAcceptedDto,
} from "@/shared/types/iot/iot.types";

export const iotDeviceService = {
  getList: (params?: IotDeviceListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<IotDeviceDto>>>(
      ENDPOINTS.IOT_DEVICES.LIST,
      { params },
    ),
  // Returns IotDeviceDetailDto — includes the full plaintext apiKey (can be viewed multiple times).
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDetailDto>>(
      ENDPOINTS.IOT_DEVICES.DETAIL(id),
    ),
  // Returns IotDeviceCreatedDto — secrets (rawApiKey, QR, MQTT) are only available once.
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
  // 200 (not 201); returns IotDeviceCreatedDto with the new key, drops revoke, does NOT change Status.
  rotateKey: (id: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_KEY(id),
    ),
  // IOT3-32/76 — xoay RIÊNG credential MQTT. apiKey còn nguyên ⇒ thiết bị tự lấy mật khẩu mới
  // qua /provision. Khác hẳn `rotateKey`, vốn buộc phải ra hiện trường nạp lại apiKey.
  rotateMqtt: (id: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_MQTT(id),
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
