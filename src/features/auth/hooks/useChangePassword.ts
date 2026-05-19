import { useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { accountService } from '@/features/auth/services/account.service';
import { useSessionStore } from '@/shared/stores/sessionStore';
import type { ChangePasswordPayload } from '@/features/auth/types/account.types';

export const useChangePassword = () => {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => accountService.changePassword(payload),
    onSuccess: () => {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      clearSession();
      navigate('/login');
    },
  });
};
