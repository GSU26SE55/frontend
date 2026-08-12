import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAccountsService } from "@/features/admin/services/account/admin-accounts.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { MergeAccountPayload } from "@/features/admin/types/account/admin.types";

// #AUTH-47: Admin merges secondary into primary → refetch account list
export const useMergeAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      primaryId,
      payload,
    }: {
      primaryId: string;
      payload: MergeAccountPayload;
    }) => adminAccountsService.merge(primaryId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};
