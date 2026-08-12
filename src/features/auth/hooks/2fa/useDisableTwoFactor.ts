import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { Disable2faPayload } from "@/features/auth/types/account.types";

// GH-295: disable 2FA — re-auth with password + TOTP
export const useDisableTwoFactor = () =>
  useMutation({
    mutationFn: (payload: Disable2faPayload) =>
      accountService.disableTwoFactor(payload),
  });
