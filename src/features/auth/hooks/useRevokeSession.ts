import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/features/auth/services/session.service";
import { KEY } from "@/shared/utils/queryKeys";

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.sessions] });
    },
  });
};
