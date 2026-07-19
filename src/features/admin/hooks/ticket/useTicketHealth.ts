import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { ticketHealthService } from "@/features/admin/services/ticket/ticket-health.service";

const COMMON = { staleTime: 0, refetchInterval: 30_000 } as const;

// 3 health endpoint (public) — auto refetch 30s cho dashboard.
export function useTicketHealth() {
  const health = useQuery({
    queryKey: QUERY_KEY.ticketHealth.health(),
    queryFn: ticketHealthService.getHealth,
    ...COMMON,
  });
  const syncLag = useQuery({
    queryKey: QUERY_KEY.ticketHealth.syncLag(),
    queryFn: ticketHealthService.getSyncLag,
    ...COMMON,
  });
  const saga = useQuery({
    queryKey: QUERY_KEY.ticketHealth.saga(),
    queryFn: ticketHealthService.getSagaHealth,
    ...COMMON,
  });
  return { health, syncLag, saga };
}
