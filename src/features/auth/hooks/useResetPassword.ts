import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { handleErrorApi } from '@/shared/lib/errors';
import type { ResetPasswordPayload } from '@/features/auth/types/auth.types';
import type { UseFormSetError } from 'react-hook-form';

export const useResetPassword = (
  setError?: UseFormSetError<{ newPassword: string; confirmPassword: string }>
) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
    onSuccess: response => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? 'Đặt lại mật khẩu thất bại');
        return;
      }
      toast.success('Mật khẩu đã được đặt lại thành công!');
      navigate('/login', { replace: true });
    },
    onError: error => handleErrorApi({ error, setError }),
  });
};
