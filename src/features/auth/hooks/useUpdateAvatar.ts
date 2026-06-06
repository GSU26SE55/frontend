import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/features/auth/services/profile.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { UpdateAvatarPayload } from "@/features/auth/types/auth.types";

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAvatarPayload) =>
      profileService.updateAvatar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY.profile] });
    },
  });
};
