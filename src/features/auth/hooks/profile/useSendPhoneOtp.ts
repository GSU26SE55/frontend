import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";

export const useSendPhoneOtp = () =>
  useMutation({
    mutationFn: () => accountService.sendPhoneOtp(),
  });
