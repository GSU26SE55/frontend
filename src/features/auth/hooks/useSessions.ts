import { useQuery } from "@tanstack/react-query";
import { sessionService } from "@/features/auth/services/session.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

export const useSessions = (activeOnly?: boolean) =>
  useQuery({
    queryKey: QUERY_KEY.sessions.me(activeOnly),
    queryFn: () =>
      sessionService.getSessions(activeOnly).then((r) => r.data.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
