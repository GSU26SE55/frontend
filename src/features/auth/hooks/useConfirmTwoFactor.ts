import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { Confirm2faPayload } from "@/features/auth/types/account.types";

// GH-295: bước 2 enroll 2FA — verify TOTP → activate, trả 8 backup codes (1 lần)
export const useConfirmTwoFactor = () =>
  useMutation({
    mutationFn: (payload: Confirm2faPayload) =>
      accountService.confirmTwoFactor(payload),
  });
