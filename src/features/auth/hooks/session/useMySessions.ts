import { useQuery } from "@tanstack/react-query";
import { sessionService } from "@/features/auth/services/session/session.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/** The current user's active login sessions — Settings → Security. */
export const useMySessions = () =>
  useQuery({
    queryKey: QUERY_KEY.sessions.me(true),
    queryFn: () => sessionService.listMine().then((r) => r.data.data),
    staleTime: 60_000,
  });
