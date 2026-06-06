import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/features/auth/services/profile.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { UpdateProfilePayload } from "@/features/auth/types/auth.types";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.profile] });
    },
  });
};
