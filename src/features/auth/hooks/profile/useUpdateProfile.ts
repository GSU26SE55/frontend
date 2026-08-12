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
      // Invalidate with the exact key to trigger an immediate refetch; setQueryData isn't
      // used because useCurrentUser & useProfile share the key but transform to different shapes
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
};
