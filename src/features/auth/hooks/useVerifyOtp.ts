import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { handleErrorApi } from '@/shared/lib/errors';
import type { OtpVerifyPayload } from '@/features/auth/types/auth.types';

export const useVerifyOtp = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) => authService.verifyOtp(payload),
    onSuccess: response => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? 'OTP không hợp lệ');
        return;
      }
      toast.success('Xác thực thành công!');
      navigate('/login', { replace: true });
    },
    onError: error => handleErrorApi({ error }),
  });
};
