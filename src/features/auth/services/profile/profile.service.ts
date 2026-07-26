import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { AccountDto } from "@/shared/types/account/account.types";
import type {
  UpdateProfilePayload,
  UpdateAvatarPayload,
} from "@/features/auth/types/auth.types";

export const profileService = {
  getMe: () => axiosInstance.get<CommonResponse<AccountDto>>(ENDPOINTS.AUTH.ME),

  updateProfile: (payload: UpdateProfilePayload) =>
    axiosInstance.put<CommonResponse<AccountDto>>(
      ENDPOINTS.AUTH.UPDATE_PROFILE,
      payload,
    ),

  updateAvatar: (payload: UpdateAvatarPayload) =>
    axiosInstance.post<CommonResponse<AccountDto>>(
      ENDPOINTS.AUTH.UPDATE_AVATAR,
      payload,
    ),
};
