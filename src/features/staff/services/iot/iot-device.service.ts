import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  IotDeviceDetailDto,
  IotDeviceCreatedDto,
} from "@/shared/types/iot/iot.types";

/**
 * Staff-side actions on the admin IoT device endpoints (`/api/admin/iot-devices/*`) that were
 * opened to the Staff role: view secrets, rotate API key, rotate MQTT key. Kept separate from
 * `features/admin/services/iot/iot-device.service.ts` — `features/staff` cannot import from
 * `features/admin` (`no-restricted-imports`).
 */
export const staffIotDeviceService = {
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<IotDeviceDetailDto>>(
      ENDPOINTS.IOT_DEVICES.DETAIL(id),
    ),
  rotateKey: (id: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_KEY(id),
    ),
  rotateMqtt: (id: string) =>
    axiosInstance.post<CommonResponse<IotDeviceCreatedDto>>(
      ENDPOINTS.IOT_DEVICES.ROTATE_MQTT(id),
    ),
};
