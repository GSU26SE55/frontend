import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { handleErrorApi } from '@/shared/lib/errors';
import type { RegisterPayload } from '@/features/auth/types/auth.types';
import type { UseFormSetError } from 'react-hook-form';

export const useRegister = (setError?: UseFormSetError<RegisterPayload>) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (response, variables) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? 'Đăng ký thất bại');
        return;
      }
      toast.success('Đăng ký thành công! Vui lòng xác thực OTP.');
      navigate('/register/verify-otp', { state: { email: variables.email } });
    },
    onError: error => handleErrorApi({ error, setError }),
  });
};
