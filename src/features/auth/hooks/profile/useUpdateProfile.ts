import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/features/auth/services/profile/profile.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { UpdateProfilePayload } from "@/features/auth/types/auth.types";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateProfile(payload),
    onSuccess: () => {
      // Invalidate với exact key để trigger refetch ngay, không dùng setQueryData
      // vì useCurrentUser & useProfile share key nhưng khác queryFn transform shape
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
};
