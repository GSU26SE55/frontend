import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { slaService } from "@/features/admin/services/sla.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { UpdateSlaRulePayload } from "@/shared/types/sla.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

export const useSlaRules = () =>
  useQuery({
    queryKey: QUERY_KEY.slaRules.list(),
    queryFn: () => slaService.getList().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useUpdateSlaRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSlaRulePayload;
    }) => slaService.update(id, payload),
    onSuccess: () => {
      toast.success(ADMIN_MESSAGES.sla.ruleUpdated);
      qc.invalidateQueries({ queryKey: [KEY.slaRules] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
