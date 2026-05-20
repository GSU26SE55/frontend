import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/shared/utils/queryKeys';
import { batteryAssetService } from '@/features/admin/services/battery-asset.service';
import { handleErrorApi } from '@/shared/lib/errors';

export function useRestoreBatteryAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batteryAssetService.restore(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
