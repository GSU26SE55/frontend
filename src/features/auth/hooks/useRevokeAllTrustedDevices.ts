import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trustedDeviceService } from "@/features/auth/services/trusted-device.service";
import { KEY } from "@/shared/utils/queryKeys";

// #AUTH-48: revoke toàn bộ trusted devices (idempotent)
export const useRevokeAllTrustedDevices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => trustedDeviceService.revokeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.trustedDevices] });
    },
  });
};
