import { useQuery } from "@tanstack/react-query";
import { trustedDeviceService } from "@/features/auth/services/trusted-device.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

// #AUTH-48: list trusted devices của user hiện tại
export const useTrustedDevices = () =>
  useQuery({
    queryKey: QUERY_KEY.trustedDevices.list(),
    queryFn: () => trustedDeviceService.list().then((r) => r.data.data),
    staleTime: 60_000,
  });
