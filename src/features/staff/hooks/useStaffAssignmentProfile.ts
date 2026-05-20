// Admin/Manager also need this hook — do NOT import cross-feature. Create a separate issue to abstract.
import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/features/staff/services/staff.service';
import { QUERY_KEY } from '@/shared/utils/queryKeys';

export const useStaffAssignmentProfile = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.staff.detail(id),
    queryFn: () => staffService.getAssignmentProfile(id).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
    enabled: !!id,
  });
