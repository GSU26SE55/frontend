import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceReadService } from "@/shared/services/iot/iot-calibration.service";
import type {
  IotDeviceListParams,
  HeartbeatListParams,
} from "@/shared/types/iot/iot.types";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

const LIVE_STATUS_POLL_MS = 5_000;

/**
 * IOT3-66 — danh sách thiết bị IoT cho Staff.
 *
 * MQTT LWT can change the status without any browser action, so live device lists remain
 * fresh and poll every 5 seconds until a device is Disabled or Decommissioned.
 */
export function useIotDevicesForStaff(
  params?: IotDeviceListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.staffList(params),
    queryFn: () =>
      iotDeviceReadService.getList(params).then((r) => r.data.data),
    enabled,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.items.some(
        (device) =>
          device.status !== IotDeviceStatusEnum.Disabled &&
          device.status !== IotDeviceStatusEnum.Decommissioned,
      )
        ? LIVE_STATUS_POLL_MS
        : false,
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
