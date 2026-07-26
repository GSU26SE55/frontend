import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import type { Sms2faPayload } from "@/features/auth/types/auth.types";

// #AUTH-58: gửi OTP SMS fallback — trả số điện thoại đã mask
export const useSend2faSms = () =>
  useMutation({
    mutationFn: (payload: Sms2faPayload) => authService.send2faSms(payload),
  });
