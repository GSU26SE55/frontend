import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSmsGatewayService } from "@/features/admin/services/admin-sms-gateway.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  GetDevicesParams,
  CreateGatewayDevicePayload,
} from "@/features/admin/types/sms-gateway.types";

export const useAdminSmsDevices = (params?: GetDevicesParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.smsGateway.list(params),
    queryFn: () =>
      adminSmsGatewayService.getDevices(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useAdminCreateSmsDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGatewayDevicePayload) =>
      adminSmsGatewayService.createDevice(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.smsGateway });
    },
  });
};

export const useAdminRevokeSmsDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminSmsGatewayService.revokeDevice(id).then((r) => r.data.data),
    onSuccess: (deviceCode) => {
      qc.invalidateQueries({ queryKey: KEY.admin.smsGateway });
      toast.success(`Đã thu hồi ${deviceCode}`);
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
