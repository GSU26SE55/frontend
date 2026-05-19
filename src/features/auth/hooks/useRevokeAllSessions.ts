import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '@/features/auth/services/session.service';
import { KEY } from '@/shared/utils/queryKeys';
import type { RevokeAllSessionsPayload } from '@/features/auth/types/auth.types';

export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: RevokeAllSessionsPayload) =>
      sessionService.revokeAllSessions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.sessions] });
    },
  });
};
