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
} from "@/shared/types/battery/sensor-reading-history.types";

// Read-only sensor readings — shared across admin/manager/staff.
// BE allows Admin, Manager, Staff, Customer to call history/aggregate/latest.
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
  // Fixed 1h bucket — long range (months/years), query is close to O(number of buckets).
  getAggregateHourly: (
    assetId: string,
    params?: SensorReadingAggregateHourlyParams,
  ) =>
    axiosInstance.get<CommonResponse<SensorReadingAggregateDto[]>>(
      ENDPOINTS.SENSOR_READINGS.AGGREGATE_HOURLY(assetId),
      { params },
    ),
};
