import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";

// GH-295: 2FA enrollment step 1 — generate secret + QR + pendingToken (NOT yet activated)
export const useInitTwoFactor = () =>
  useMutation({
    mutationFn: () => accountService.initTwoFactor(),
  });
