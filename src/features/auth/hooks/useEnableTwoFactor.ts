import { useMutation } from '@tanstack/react-query';
import { accountService } from '@/features/auth/services/account.service';

export const useEnableTwoFactor = () =>
  useMutation({
    mutationFn: () => accountService.enableTwoFactor(),
  });
