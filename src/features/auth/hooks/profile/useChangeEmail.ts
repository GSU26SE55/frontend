import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { ChangeEmailPayload } from "@/features/auth/types/account.types";

export const useChangeEmail = () =>
  useMutation({
    mutationFn: (payload: ChangeEmailPayload) =>
      accountService.changeEmail(payload),
  });
