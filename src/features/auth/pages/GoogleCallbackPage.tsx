import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { saveTokens } from '@/shared/lib/axios';
import { decodeToken, redirectByRole } from '@/shared/types/session.types';
import { useSessionStore } from '@/shared/stores/sessionStore';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useSessionStore(s => s.setSession);

  useEffect(() => {
    try {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      // Remove tokens from URL immediately to prevent token leakage
      window.history.replaceState({}, '', '/auth/google/callback');

      if (!accessToken || !refreshToken) {
        throw new Error('Missing tokens in callback');
      }

      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);
      setSession(user);
      navigate(redirectByRole(user.role), { replace: true });
    } catch (err) {
      console.error('[GoogleCallback]', err);
      toast.error('Đăng nhập Google thất bại');
      navigate('/login', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default GoogleCallbackPage;
