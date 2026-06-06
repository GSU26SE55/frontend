import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";

export const useUnlinkGoogle = () =>
  useMutation({
    mutationFn: () => accountService.unlinkGoogle(),
  });
