import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffTicketService } from "../services/ticket.service";

// GET /api/staff/tickets/maintenance-logs/me — lịch sử bảo trì cá nhân (gom theo ticket).
export function useStaffMaintenanceLogs() {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.myMaintenanceLogs(),
    queryFn: () =>
      staffTicketService.getMyMaintenanceLogs().then((r) => r.data.data ?? []),
    staleTime: 30_000,
  });
}
