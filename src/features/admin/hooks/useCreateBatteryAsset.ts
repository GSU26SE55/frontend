import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/shared/utils/queryKeys';
import { batteryAssetService } from '@/features/admin/services/battery-asset.service';
import type { CreateBatteryAssetPayload } from '@/features/admin/types/battery-asset.types';

export function useCreateBatteryAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBatteryAssetPayload) =>
      batteryAssetService.create(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
    },
  });
}
