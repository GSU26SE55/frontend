import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";

// GH-295: bước 1 enroll 2FA — sinh secret + QR + pendingToken (CHƯA activate)
export const useInitTwoFactor = () =>
  useMutation({
    mutationFn: () => accountService.initTwoFactor(),
  });
