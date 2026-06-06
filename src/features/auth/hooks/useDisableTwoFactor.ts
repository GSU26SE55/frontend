import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";

export const useDisableTwoFactor = () =>
  useMutation({
    mutationFn: () => accountService.disableTwoFactor(),
  });
