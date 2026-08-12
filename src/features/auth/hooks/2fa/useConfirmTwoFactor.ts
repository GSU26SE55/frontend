import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { Confirm2faPayload } from "@/features/auth/types/account.types";

// GH-295: 2FA enrollment step 2 — verify TOTP → activate, returns 8 backup codes (once)
export const useConfirmTwoFactor = () =>
  useMutation({
    mutationFn: (payload: Confirm2faPayload) =>
      accountService.confirmTwoFactor(payload),
  });
