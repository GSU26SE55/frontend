import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { RegenBackupCodesPayload } from "@/features/auth/types/account.types";

// GH-295: sinh lại 8 backup codes mới — vô hiệu hóa codes cũ (cần TOTP)
export const useRegenerateBackupCodes = () =>
  useMutation({
    mutationFn: (payload: RegenBackupCodesPayload) =>
      accountService.regenerateBackupCodes(payload),
  });
