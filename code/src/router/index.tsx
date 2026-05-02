import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ManagerDashboardPage } from '@/features/manager/pages/ManagerDashboardPage'
import { StaffDashboardPage } from '@/features/staff/pages/StaffDashboardPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { RoleRoute } from '@/router/RoleRoute'
import { RootRedirect } from '@/router/RootRedirect'
import { UnauthorizedPage } from '@/shared/components/common/UnauthorizedPage'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['Admin']} />,
        children: [
          {
            path: '/admin',
            element: <AppLayout />,
            children: [{ index: true, element: <AdminDashboardPage /> }],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['Manager']} />,
        children: [
          {
            path: '/manager',
            element: <AppLayout />,
            children: [{ index: true, element: <ManagerDashboardPage /> }],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['Staff']} />,
        children: [
          {
            path: '/staff',
            element: <AppLayout />,
            children: [{ index: true, element: <StaffDashboardPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
