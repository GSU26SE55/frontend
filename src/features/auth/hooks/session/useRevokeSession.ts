import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/features/auth/services/session/session.service";
import { KEY } from "@/shared/utils/queryKeys";

/** Sign one device out of the current account. */
export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionService.revokeOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.sessions] });
    },
  });
};
