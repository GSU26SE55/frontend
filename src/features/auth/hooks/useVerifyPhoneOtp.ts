import { useMutation } from '@tanstack/react-query';
import { accountService } from '@/features/auth/services/account.service';
import type { VerifyPhoneOtpPayload } from '@/features/auth/types/account.types';

export const useVerifyPhoneOtp = () =>
  useMutation({
    mutationFn: (payload: VerifyPhoneOtpPayload) => accountService.verifyPhoneOtp(payload),
  });
