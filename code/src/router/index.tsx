import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { ManagerDashboardPage } from '@/features/manager/pages/ManagerDashboardPage'
import { StaffMyTicketsPage } from '@/features/staff/pages/StaffMyTicketsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['Admin']} />,
        children: [
          {
            path: 'admin',
            element: <AppLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['Manager']} />,
        children: [
          {
            path: 'manager',
            element: <AppLayout />,
            children: [
              { index: true, element: <ManagerDashboardPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['Staff']} />,
        children: [
          {
            path: 'staff',
            element: <AppLayout />,
            children: [
              { index: true, element: <StaffMyTicketsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/unauthorized',
    element: (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground">403 — Không có quyền truy cập</p>
      </div>
    ),
  },
  {
    path: '*',
    element: (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground">404 — Không tìm thấy trang</p>
      </div>
    ),
  },
])
