import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/features/auth/services/profile/profile.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

export const useProfile = () =>
  useQuery({
    queryKey: QUERY_KEY.profile.me(),
    queryFn: () => profileService.getMe().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
