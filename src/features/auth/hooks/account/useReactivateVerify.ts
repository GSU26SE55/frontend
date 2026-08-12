import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import type { ReactivateVerifyPayload } from "@/features/auth/types/auth.types";

// #AUTH-50 step 2: verify OTP → restore account (does NOT issue tokens)
export const useReactivateVerify = () =>
  useMutation({
    mutationFn: (payload: ReactivateVerifyPayload) =>
      authService.reactivateVerify(payload),
  });
