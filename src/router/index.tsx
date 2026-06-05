import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { UserRole } from "@/shared/types/session.types";
import AuthLayout from "@/shared/components/layout/AuthLayout";
import AppLayout from "@/shared/components/layout/AppLayout";
import LandingPage from "@/features/landing/pages/LandingPage";
import GoogleCallbackPage from "@/features/auth/pages/GoogleCallbackPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import OtpVerifyPage from "@/features/auth/pages/OtpVerifyPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import AccountSettingsPage from "@/features/auth/pages/AccountSettingsPage";
import AdminDashboardPage from "@/features/admin/pages/DashboardPage";
import AdminSiteListPage from "@/features/admin/pages/SiteListPage";
import AdminSiteDetailPage from "@/features/admin/pages/SiteDetailPage";
import BatteryAssetsPage from "@/features/admin/pages/BatteryAssetsPage";
import BatteryAssetDetailPage from "@/features/admin/pages/BatteryAssetDetailPage";
import AccountsPage from "@/features/admin/pages/AccountsPage";
import RolesPage from "@/features/admin/pages/RolesPage";
import AdminTicketListPage from "@/features/admin/pages/AdminTicketListPage";
import AdminTicketDetailPage from "@/features/admin/pages/AdminTicketDetailPage";
import ManagerDashboardPage from "@/features/manager/pages/DashboardPage";
import ManagerSiteListPage from "@/features/manager/pages/SiteListPage";
import ManagerSiteDetailPage from "@/features/manager/pages/SiteDetailPage";
import ManagerTicketListPage from "@/features/manager/pages/TicketListPage";
import ManagerTicketQueuePage from "@/features/manager/pages/TicketQueuePage";
import ManagerTicketDetailPage from "@/features/manager/pages/TicketDetailPage";
import StaffTicketListPage from "@/features/staff/pages/TicketListPage";
import StaffTicketDetailPage from "@/features/staff/pages/TicketDetailPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/register/verify-otp", element: <OtpVerifyPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: "/auth/google/callback",
    element: <GoogleCallbackPage />,
  },
  {
    path: "/unauthorized",
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-destructive">403</h1>
          <p className="mt-2 text-muted-foreground">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/settings", element: <AccountSettingsPage /> },
      {
        element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
        children: [
          {
            path: "/admin",
            element: <AppLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "sites", element: <AdminSiteListPage /> },
              { path: "sites/:id", element: <AdminSiteDetailPage /> },
              { path: "battery-assets", element: <BatteryAssetsPage /> },
              {
                path: "battery-assets/:id",
                element: <BatteryAssetDetailPage />,
              },
              { path: "accounts", element: <AccountsPage /> },
              { path: "roles", element: <RolesPage /> },
              { path: "tickets", element: <AdminTicketListPage /> },
              { path: "tickets/:id", element: <AdminTicketDetailPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.MANAGER]} />,
        children: [
          {
            path: "/manager",
            element: <AppLayout />,
            children: [
              { index: true, element: <ManagerDashboardPage /> },
              { path: "dashboard", element: <ManagerDashboardPage /> },
              { path: "sites", element: <ManagerSiteListPage /> },
              { path: "sites/:id", element: <ManagerSiteDetailPage /> },
              { path: "tickets", element: <ManagerTicketListPage /> },
              { path: "tickets/queue", element: <ManagerTicketQueuePage /> },
              { path: "tickets/:id", element: <ManagerTicketDetailPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.STAFF]} />,
        children: [
          {
            path: "/staff",
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="tickets" replace /> },
              { path: "tickets", element: <StaffTicketListPage /> },
              { path: "tickets/:id", element: <StaffTicketDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
