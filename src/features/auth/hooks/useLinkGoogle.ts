import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { LinkGooglePayload } from "@/features/auth/types/account.types";

export const useLinkGoogle = () =>
  useMutation({
    mutationFn: (payload: LinkGooglePayload) =>
      accountService.linkGoogle(payload),
  });
