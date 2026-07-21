import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trustedDeviceService } from "@/features/auth/services/trusted-device/trusted-device.service";
import { KEY } from "@/shared/utils/queryKeys";

// #AUTH-48: revoke 1 trusted device (idempotent)
export const useRevokeTrustedDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trustedDeviceService.revokeOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.trustedDevices] });
    },
  });
};
