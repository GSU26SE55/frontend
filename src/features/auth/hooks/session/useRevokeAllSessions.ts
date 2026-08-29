import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/features/auth/services/session/session.service";
import { KEY } from "@/shared/utils/queryKeys";

/** Sign every other device out, keeping this one signed in. */
export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sessionService.revokeAllOthers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.sessions] });
    },
  });
};
