import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/features/admin/services/battery-asset.service";
import type { TransferOwnerPayload } from "@/features/admin/types/battery-asset.types";

export function useTransferOwner(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferOwnerPayload) =>
      batteryAssetService.transferOwner(assetId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
    },
  });
}
