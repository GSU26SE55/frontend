import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth.service';
import { useSessionStore } from '@/shared/stores/sessionStore';
import { QUERY_KEY } from '@/shared/utils/queryKeys';

export const useCurrentUser = () => {
  const isAuthenticated = useSessionStore(s => s.isAuthenticated);

  return useQuery({
    queryKey: QUERY_KEY.profile.me(),
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    select: response => response.data.data,
  });
};
