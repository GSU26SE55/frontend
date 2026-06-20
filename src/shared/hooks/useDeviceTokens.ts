import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deviceTokenService } from "@/shared/services/device-token.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  RegisterDeviceTokenPayload,
  UnregisterDeviceTokenPayload,
} from "@/shared/types/device-token.types";

export const useDeviceTokens = () =>
  useQuery({
    queryKey: QUERY_KEY.deviceTokens.list(),
    queryFn: () => deviceTokenService.getList().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useRegisterDeviceToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterDeviceTokenPayload) =>
      deviceTokenService.register(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.deviceTokens.list() });
    },
  });
};

export const useUnregisterDeviceToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnregisterDeviceTokenPayload) =>
      deviceTokenService.unregister(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.deviceTokens.list() });
    },
  });
};
