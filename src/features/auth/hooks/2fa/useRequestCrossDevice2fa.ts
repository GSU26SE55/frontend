import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";

// #AUTH-51: Device A request cross-device 2FA setup → secret + token + QR uri
export const useRequestCrossDevice2fa = () =>
  useMutation({
    mutationFn: () => accountService.requestCrossDevice2fa(),
  });
