import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import type { ReactivateRequestPayload } from "@/features/auth/types/auth.types";

// #AUTH-50 bước 1: gửi OTP khôi phục account (anti-enumeration — luôn 200)
export const useReactivateRequest = () =>
  useMutation({
    mutationFn: (payload: ReactivateRequestPayload) =>
      authService.reactivateRequest(payload),
  });
