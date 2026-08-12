import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import type { ReactivateRequestPayload } from "@/features/auth/types/auth.types";

// #AUTH-50 step 1: send the account reactivation OTP (anti-enumeration — always 200)
export const useReactivateRequest = () =>
  useMutation({
    mutationFn: (payload: ReactivateRequestPayload) =>
      authService.reactivateRequest(payload),
  });
