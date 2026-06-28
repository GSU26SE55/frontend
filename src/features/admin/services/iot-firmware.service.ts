import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  IotFirmwareReleaseDto,
  FirmwareBinaryUploadDto,
  CreateFirmwareReleasePayload,
  UploadFirmwareBinaryPayload,
  FirmwareReleaseListParams,
} from "@/shared/types/iot.types";

export const iotFirmwareService = {
  getList: (params?: FirmwareReleaseListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<IotFirmwareReleaseDto>>
    >(ENDPOINTS.IOT_FIRMWARE.LIST, { params }),
  // Bước 1 của 2-step: upload .bin (multipart) → trả artifactUrl + sha256 + size. KHÔNG tạo release.
  uploadBinary: (payload: UploadFirmwareBinaryPayload) => {
    const form = new FormData();
    form.append("file", payload.file);
    form.append("version", payload.version);
    form.append("hardwareRevision", payload.hardwareRevision);
    if (payload.isRequired !== undefined)
      form.append("isRequired", String(payload.isRequired));
    if (payload.channel !== undefined)
      form.append("channel", String(payload.channel));
    if (payload.releaseNotes) form.append("releaseNotes", payload.releaseNotes);
    if (payload.deviceModel) form.append("deviceModel", payload.deviceModel);
    return axiosInstance.post<CommonResponse<FirmwareBinaryUploadDto>>(
      ENDPOINTS.IOT_FIRMWARE.UPLOAD_BINARY,
      form,
      { headers: { "Content-Type": undefined } },
    );
  },
  // Bước 2 của 2-step: tạo release record từ metadata + artifact info.
  createRelease: (payload: CreateFirmwareReleasePayload) =>
    axiosInstance.post<CommonResponse<IotFirmwareReleaseDto>>(
      ENDPOINTS.IOT_FIRMWARE.CREATE,
      payload,
    ),
  publish: (id: string) =>
    axiosInstance.post<CommonResponse<IotFirmwareReleaseDto>>(
      ENDPOINTS.IOT_FIRMWARE.PUBLISH(id),
    ),
  archive: (id: string) =>
    axiosInstance.post<CommonResponse<null>>(
      ENDPOINTS.IOT_FIRMWARE.ARCHIVE(id),
    ),
};
