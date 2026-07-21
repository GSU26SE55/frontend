import { useQuery } from "@tanstack/react-query";
import { managerSiteService } from "@/features/manager/services/site/site.service";
import { KEY } from "@/shared/utils/queryKeys";

export const useStaffAssignmentList = () => {
  return useQuery({
    queryKey: [...KEY.manager.tickets, "staff-list"],
    queryFn: () => managerSiteService.getStaffList(),
    staleTime: 5 * 60_000,
  });
};
