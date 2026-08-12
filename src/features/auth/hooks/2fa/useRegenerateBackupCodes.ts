import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { RegenBackupCodesPayload } from "@/features/auth/types/account.types";

// GH-295: regenerate 8 new backup codes — invalidates the old codes (requires TOTP)
export const useRegenerateBackupCodes = () =>
  useMutation({
    mutationFn: (payload: RegenBackupCodesPayload) =>
      accountService.regenerateBackupCodes(payload),
  });
