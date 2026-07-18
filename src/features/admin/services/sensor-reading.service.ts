import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  SensorReadingDto,
  SensorReadingHistoryParams,
  SensorReadingHistoryResponseDto,
  SensorReadingAggregateParams,
  SensorReadingAggregateHourlyParams,
  SensorReadingAggregateDto,
} from "@/features/admin/types/sensor-reading.types";

export const sensorReadingService = {
  getLatest: (assetId: string) =>
    axiosInstance.get<CommonResponse<SensorReadingDto>>(
      ENDPOINTS.SENSOR_READINGS.LATEST(assetId),
    ),
  getHistory: (assetId: string, params?: SensorReadingHistoryParams) =>
    axiosInstance.get<CommonResponse<SensorReadingHistoryResponseDto>>(
      ENDPOINTS.SENSOR_READINGS.HISTORY(assetId),
      { params },
    ),
  getAggregate: (assetId: string, params?: SensorReadingAggregateParams) =>
    axiosInstance.get<CommonResponse<SensorReadingAggregateDto[]>>(
      ENDPOINTS.SENSOR_READINGS.AGGREGATE(assetId),
      { params },
    ),
  // Bucket 1h cố định — range dài (tháng/năm), query gần O(số bucket).
  getAggregateHourly: (
    assetId: string,
    params?: SensorReadingAggregateHourlyParams,
  ) =>
    axiosInstance.get<CommonResponse<SensorReadingAggregateDto[]>>(
      ENDPOINTS.SENSOR_READINGS.AGGREGATE_HOURLY(assetId),
      { params },
    ),
};
