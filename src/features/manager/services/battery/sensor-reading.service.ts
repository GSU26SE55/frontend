import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  SensorReadingHistoryParams,
  SensorReadingHistoryResponseDto,
} from "@/features/manager/types/battery/sensor-reading.types";

// Chỉ đọc — Manager xem lịch sử sử dụng pin gắn với ticket, không cần latest/aggregate.
export const sensorReadingService = {
  getHistory: (assetId: string, params?: SensorReadingHistoryParams) =>
    axiosInstance.get<CommonResponse<SensorReadingHistoryResponseDto>>(
      ENDPOINTS.SENSOR_READINGS.HISTORY(assetId),
      { params },
    ),
};
