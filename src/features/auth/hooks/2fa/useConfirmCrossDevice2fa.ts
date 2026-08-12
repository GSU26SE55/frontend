import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { CrossDeviceConfirmPayload } from "@/features/auth/types/account.types";

// #AUTH-51: Device B confirms with token + TOTP → enables 2FA
export const useConfirmCrossDevice2fa = () =>
  useMutation({
    mutationFn: (payload: CrossDeviceConfirmPayload) =>
      accountService.confirmCrossDevice2fa(payload),
  });
