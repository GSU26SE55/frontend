import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '@/shared/components/layout/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import OtpVerifyPage from '@/features/auth/pages/OtpVerifyPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import GoogleCallbackPage from '@/features/auth/pages/GoogleCallbackPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/register/verify-otp', element: <OtpVerifyPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/auth/google/callback',
    element: <GoogleCallbackPage />,
  },
  {
    path: '/unauthorized',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive">403</h1>
          <p className="mt-2 text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['ADMIN']} />,
        children: [{ path: '/admin/*', element: <div>Admin Portal</div> }],
      },
      {
        element: <RoleRoute allowedRoles={['MANAGER']} />,
        children: [{ path: '/manager/*', element: <div>Manager Portal</div> }],
      },
      {
        element: <RoleRoute allowedRoles={['STAFF']} />,
        children: [{ path: '/staff/*', element: <div>Staff Portal</div> }],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
