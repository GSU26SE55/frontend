import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAccountsService } from "@/features/admin/services/admin-accounts.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { MergeAccountPayload } from "@/features/admin/types/admin.types";

// #AUTH-47: Admin merge secondary vào primary → refetch danh sách account
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
