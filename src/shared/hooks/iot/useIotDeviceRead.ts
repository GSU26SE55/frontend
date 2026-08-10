import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceReadService } from "@/shared/services/iot/iot-calibration.service";
import type {
  IotDeviceListParams,
  HeartbeatListParams,
} from "@/shared/types/iot/iot.types";

/**
 * IOT3-66 — danh sách thiết bị IoT cho Staff.
 *
 * `staleTime` 30 giây: trạng thái đổi theo nhịp heartbeat (mặc định 60 s), làm mới dày hơn thế
 * chỉ tốn request mà không có số liệu mới.
 */
export function useIotDevicesForStaff(params?: IotDeviceListParams) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.staffList(params),
    queryFn: () => iotDeviceReadService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
  });
}

/**
 * IOT3-67 — lịch sử heartbeat của một thiết bị.
 *
 * `refetchInterval` 60 giây khớp đúng nhịp heartbeat mặc định: nhanh hơn là kéo về cùng một dữ
 * liệu, chậm hơn là biểu đồ luôn trễ một nhịp so với thực tế.
 */
export function useIotDeviceHeartbeats(
  deviceId: string | undefined,
  params?: HeartbeatListParams,
) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.heartbeats(deviceId ?? "", params),
    queryFn: () =>
      iotDeviceReadService
        .getHeartbeats(deviceId as string, params)
        .then((r) => r.data.data),
    enabled: !!deviceId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
