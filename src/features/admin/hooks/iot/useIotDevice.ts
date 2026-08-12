import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceService } from "@/features/admin/services/iot/iot-device.service";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

const PROVISION_STATUS_POLL_MS = 5_000;

export function useIotDevice(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.detail(id ?? ""),
    queryFn: () => iotDeviceService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
    // Provision diễn ra ngoài trình duyệt. Poll ngắn trong lúc Pending để màn
    // hình tự chuyển Active ngay khi ESP nhận backend ACK, rồi tự dừng poll.
    refetchInterval: (query) =>
      query.state.data?.status === IotDeviceStatusEnum.Pending
        ? PROVISION_STATUS_POLL_MS
        : false,
  });
}
