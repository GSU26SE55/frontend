import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { RootRedirect } from './RootRedirect'
import { NotFoundPage } from './NotFoundPage'
import { UnauthorizedPage } from './UnauthorizedPage'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'

import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'

import { UserManagementPage } from '@/features/admin/pages/UserManagementPage'
import { BatteryConfigPage } from '@/features/admin/pages/BatteryConfigPage'
import { SLARulesPage } from '@/features/admin/pages/SLARulesPage'
import { AuditLogPage } from '@/features/admin/pages/AuditLogPage'

import { DashboardPage } from '@/features/manager/pages/DashboardPage'
import { TicketQueuePage } from '@/features/manager/pages/TicketQueuePage'
import { TicketDetailPage } from '@/features/manager/pages/TicketDetailPage'
import { ReportsPage } from '@/features/manager/pages/ReportsPage'

import { MyTicketsPage } from '@/features/staff/pages/MyTicketsPage'
import { TicketWorkPage } from '@/features/staff/pages/TicketWorkPage'
import { AIWorkflowPage } from '@/features/ai-workflow/pages/AIWorkflowPage'

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="admin" />,
        children: [
          {
            path: '/admin',
            element: <AppLayout />,
            children: [
              { path: 'users', element: <UserManagementPage /> },
              { path: 'batteries', element: <BatteryConfigPage /> },
              { path: 'sla-rules', element: <SLARulesPage /> },
              { path: 'audit-logs', element: <AuditLogPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute role="manager" />,
        children: [
          {
            path: '/manager',
            element: <AppLayout />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'tickets', element: <TicketQueuePage /> },
              { path: 'tickets/:id', element: <TicketDetailPage /> },
              { path: 'reports', element: <ReportsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute role="staff" />,
        children: [
          {
            path: '/staff',
            element: <AppLayout />,
            children: [
              { path: 'tickets', element: <MyTicketsPage /> },
              { path: 'tickets/:id', element: <TicketWorkPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/ai-workflow', element: <AIWorkflowPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
])
