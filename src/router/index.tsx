import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import SmartHome from "./SmartHome";
import { UserRole } from "@/shared/types/account/session.types";
import AuthLayout from "@/shared/components/layout/AuthLayout";
import AppLayout from "@/shared/components/layout/AppLayout";
import RoleAwareAppLayout from "./RoleAwareAppLayout";
import { ADMIN_NAV } from "@/features/admin/config/adminNav";
import ManagerAppLayout from "@/features/manager/components/layout/ManagerAppLayout";
import { STAFF_NAV } from "@/features/staff/config/staffNav";
import GoogleCallbackPage from "@/features/auth/pages/GoogleCallbackPage";
import UseMobileAppPage from "@/features/auth/pages/UseMobileAppPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import Login2faPage from "@/features/auth/pages/Login2faPage";
import ReactivatePage from "@/features/auth/pages/ReactivatePage";
import CrossDeviceConfirmPage from "@/features/auth/pages/CrossDeviceConfirmPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import OtpVerifyPage from "@/features/auth/pages/OtpVerifyPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import AcceptInvitePage from "@/features/auth/pages/AcceptInvitePage";
import AccountSettingsPage from "@/features/auth/pages/AccountSettingsPage";
import NotificationInboxPage from "@/shared/pages/NotificationInboxPage";
import NotificationUnsubscribePage from "@/shared/pages/NotificationUnsubscribePage";
import ProfilePage from "@/features/auth/pages/ProfilePage";
import AuditLogsPage from "@/features/admin/pages/AuditLogsPage";
import BatteryAuditLogsPage from "@/features/admin/pages/BatteryAuditLogsPage";
import FilesAuditLogsPage from "@/features/admin/pages/FilesAuditLogsPage";
import NotificationAdminPage from "@/features/admin/pages/NotificationAdminPage";
import NotificationTemplatesPage from "@/features/admin/pages/NotificationTemplatesPage";
import NotificationGroupsPage from "@/features/admin/pages/NotificationGroupsPage";
import NotificationBatchesPage from "@/features/admin/pages/NotificationBatchesPage";
import AdminDashboardPage from "@/features/admin/pages/DashboardPage";
import AdminAnalyticsPage from "@/features/admin/pages/AnalyticsPage";
import AdminSiteListPage from "@/features/admin/pages/SiteListPage";
import AdminSiteDetailPage from "@/features/admin/pages/SiteDetailPage";
import BatteryAssetsPage from "@/features/admin/pages/BatteryAssetsPage";
import BatteryTypesPage from "@/features/admin/pages/BatteryTypesPage";
import BatteryAssetDetailPage from "@/features/admin/pages/BatteryAssetDetailPage";
import IoTDevicesPage from "@/features/admin/pages/IoTDevicesPage";
import IoTDeviceFormPage from "@/features/admin/pages/IoTDeviceFormPage";
import IoTDeviceDetailPage from "@/features/admin/pages/IoTDeviceDetailPage";
import IoTFirmwareReleasesPage from "@/features/admin/pages/IoTFirmwareReleasesPage";
import IoTFirmwareFormPage from "@/features/admin/pages/IoTFirmwareFormPage";
import ManagerCalibrationsExpiringPage from "@/features/manager/pages/CalibrationsExpiringPage";
import StaffIoTCalibrationsPage from "@/features/staff/pages/IoTCalibrationsPage";
import StaffIoTDevicesPage from "@/features/staff/pages/IoTDevicesPage";
import StaffIoTDeviceDetailPage from "@/features/staff/pages/IoTDeviceDetailPage";
import AccountsPage from "@/features/admin/pages/AccountsPage";
import RolesPage from "@/features/admin/pages/RolesPage";
import AdminTicketListPage from "@/features/admin/pages/AdminTicketListPage";
import AdminSagaDebugPage from "@/features/admin/pages/SagaDebugPage";
import AdminTicketDetailPage from "@/features/admin/pages/AdminTicketDetailPage";
import AdminAlertsPage from "@/features/admin/pages/AlertsPage";
import AdminEnvironmentalIncidentsPage from "@/features/admin/pages/EnvironmentalIncidentsPage";
import AdminAmbientConfigPage from "@/features/admin/pages/AmbientConfigPage";
import AdminSmsGatewayPage from "@/features/admin/pages/SmsGatewayPage";
import ManagerDashboardPage from "@/features/manager/pages/DashboardPage";
import ManagerAnalyticsPage from "@/features/manager/pages/AnalyticsPage";
import ManagerSiteListPage from "@/features/manager/pages/SiteListPage";
import ManagerSiteDetailPage from "@/features/manager/pages/SiteDetailPage";
import ManagerBatteryAssetsPage from "@/features/manager/pages/BatteryAssetsPage";
import ManagerBatteryAssetDetailPage from "@/features/manager/pages/BatteryAssetDetailPage";
import ManagerTicketListPage from "@/features/manager/pages/TicketListPage";
import ManagerTicketQueuePage from "@/features/manager/pages/TicketQueuePage";
import ManagerTicketDetailPage from "@/features/manager/pages/TicketDetailPage";
import ManagerMergeComparePage from "@/features/manager/pages/MergeComparePage";
import ManagerAlertsPage from "@/features/manager/pages/AlertsPage";
import ManagerEnvironmentalIncidentsPage from "@/features/manager/pages/EnvironmentalIncidentsPage";
import ManagerAmbientConfigPage from "@/features/manager/pages/AmbientConfigPage";
import StaffDashboardPage from "@/features/staff/pages/DashboardPage";
import StaffTicketListPage from "@/features/staff/pages/TicketListPage";
import StaffTicketDetailPage from "@/features/staff/pages/TicketDetailPage";
import StaffMyMaintenanceLogsPage from "@/features/staff/pages/MyMaintenanceLogsPage";
import StaffSlaMonitorPage from "@/features/staff/pages/SlaMonitorPage";
import StaffAlertsPage from "@/features/staff/pages/AlertsPage";
import AdminKbListPage from "@/features/admin/pages/KbListPage";
import AdminKbDetailPage from "@/features/admin/pages/KbDetailPage";
import AdminKbEditorPage from "@/features/admin/pages/KbEditorPage";
import ManagerKbListPage from "@/features/manager/pages/KbListPage";
import ManagerKbDetailPage from "@/features/manager/pages/KbDetailPage";
import ManagerKbEditorPage from "@/features/manager/pages/KbEditorPage";
import StaffKbListPage from "@/features/staff/pages/KbListPage";
import StaffKbDetailPage from "@/features/staff/pages/KbDetailPage";
import StaffKbEditorPage from "@/features/staff/pages/KbEditorPage";
import AdminBlogListPage from "@/features/admin/pages/BlogListPage";
import AdminBlogDetailPage from "@/features/admin/pages/BlogDetailPage";
import AdminBlogEditorPage from "@/features/admin/pages/BlogEditorPage";
import ManagerBlogListPage from "@/features/manager/pages/BlogListPage";
import ManagerBlogDetailPage from "@/features/manager/pages/BlogDetailPage";
import ManagerBlogEditorPage from "@/features/manager/pages/BlogEditorPage";
import StaffBlogListPage from "@/features/staff/pages/BlogListPage";
import StaffBlogDetailPage from "@/features/staff/pages/BlogDetailPage";
import StaffBlogEditorPage from "@/features/staff/pages/BlogEditorPage";
import StaffBatteryAlertsPage from "@/features/staff/pages/BatteryAlertsPage";
import StaffBatteryAssetDetailPage from "@/features/staff/pages/BatteryAssetDetailPage";
import StaffEnvironmentalIncidentsPage from "@/features/staff/pages/EnvironmentalIncidentsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SmartHome />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/login/2fa", element: <Login2faPage /> },
      { path: "/reactivate", element: <ReactivatePage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/register/verify-otp", element: <OtpVerifyPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/invite/accept", element: <AcceptInvitePage /> },
    ],
  },
  {
    path: "/auth/google/callback",
    element: <GoogleCallbackPage />,
  },
  {
    // CUSTOMER login on web → redirected here (web not supported, use the Mobile App)
    path: "/use-mobile-app",
    element: <UseMobileAppPage />,
  },
  {
    path: "/notification-unsubscribe",
    element: <NotificationUnsubscribePage />,
  },
  {
    path: "/unauthorized",
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-destructive">403</h1>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/settings",
        element: <RoleAwareAppLayout />,
        children: [{ index: true, element: <AccountSettingsPage /> }],
      },
      {
        // Inbox shared across every role (like /settings) — the content is already
        // filtered by the UserId in the JWT on the BE, so no need to duplicate the route per role.
        path: "/notifications",
        element: <RoleAwareAppLayout />,
        children: [{ index: true, element: <NotificationInboxPage /> }],
      },
      {
        // #AUTH-51: Device B confirm — only requires login (any role), bypasses AppLayout
        path: "/2fa/cross-device-confirm",
        element: <CrossDeviceConfirmPage />,
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
        children: [
          {
            path: "/admin",
            element: <AppLayout sections={ADMIN_NAV} />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "analytics", element: <AdminAnalyticsPage /> },
              { path: "sites", element: <AdminSiteListPage /> },
              { path: "sites/:id", element: <AdminSiteDetailPage /> },
              { path: "battery-assets", element: <BatteryAssetsPage /> },
              { path: "battery-types", element: <BatteryTypesPage /> },
              {
                path: "battery-assets/:id",
                element: <BatteryAssetDetailPage />,
              },
              { path: "iot-devices", element: <IoTDevicesPage /> },
              { path: "iot-devices/new", element: <IoTDeviceFormPage /> },
              { path: "iot-devices/:id", element: <IoTDeviceDetailPage /> },
              {
                path: "iot-devices/:id/edit",
                element: <IoTDeviceFormPage />,
              },
              { path: "iot-firmware", element: <IoTFirmwareReleasesPage /> },
              { path: "iot-firmware/new", element: <IoTFirmwareFormPage /> },
              { path: "accounts", element: <AccountsPage /> },
              { path: "roles", element: <RolesPage /> },
              { path: "tickets", element: <AdminTicketListPage /> },
              { path: "tickets/:id", element: <AdminTicketDetailPage /> },
              { path: "kb", element: <AdminKbListPage /> },
              { path: "kb/new", element: <AdminKbEditorPage /> },
              { path: "kb/:id", element: <AdminKbDetailPage /> },
              { path: "kb/:id/edit", element: <AdminKbEditorPage /> },
              { path: "blog", element: <AdminBlogListPage /> },
              { path: "blog/new", element: <AdminBlogEditorPage /> },
              { path: "blog/:id", element: <AdminBlogDetailPage /> },
              { path: "blog/:id/edit", element: <AdminBlogEditorPage /> },
              { path: "alerts", element: <AdminAlertsPage /> },
              {
                path: "environmental-incidents",
                element: <AdminEnvironmentalIncidentsPage />,
              },
              { path: "ambient", element: <AdminAmbientConfigPage /> },
              { path: "sms-gateway", element: <AdminSmsGatewayPage /> },
              { path: "sagas", element: <AdminSagaDebugPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "audit-logs", element: <AuditLogsPage /> },
              {
                path: "battery-audit-logs",
                element: <BatteryAuditLogsPage />,
              },
              { path: "files-audit-logs", element: <FilesAuditLogsPage /> },
              { path: "notifications", element: <NotificationAdminPage /> },
              {
                path: "notification-templates",
                element: <NotificationTemplatesPage />,
              },
              {
                path: "notification-groups",
                element: <NotificationGroupsPage />,
              },
              {
                path: "notification-batches",
                element: <NotificationBatchesPage />,
              },
              { path: "settings", element: <AccountSettingsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.MANAGER]} />,
        children: [
          {
            path: "/manager",
            element: <ManagerAppLayout />,
            children: [
              { index: true, element: <ManagerDashboardPage /> },
              { path: "dashboard", element: <ManagerDashboardPage /> },
              { path: "analytics", element: <ManagerAnalyticsPage /> },
              { path: "sites", element: <ManagerSiteListPage /> },
              { path: "sites/:id", element: <ManagerSiteDetailPage /> },
              {
                path: "battery-assets",
                element: <ManagerBatteryAssetsPage />,
              },
              {
                path: "battery-assets/:id",
                element: <ManagerBatteryAssetDetailPage />,
              },
              { path: "tickets", element: <ManagerTicketListPage /> },
              { path: "tickets/queue", element: <ManagerTicketQueuePage /> },
              { path: "tickets/:id", element: <ManagerTicketDetailPage /> },
              {
                path: "tickets/:id/merge",
                element: <ManagerMergeComparePage />,
              },
              { path: "kb", element: <ManagerKbListPage /> },
              { path: "kb/new", element: <ManagerKbEditorPage /> },
              { path: "kb/:id", element: <ManagerKbDetailPage /> },
              { path: "kb/:id/edit", element: <ManagerKbEditorPage /> },
              { path: "blog", element: <ManagerBlogListPage /> },
              { path: "blog/new", element: <ManagerBlogEditorPage /> },
              { path: "blog/:id", element: <ManagerBlogDetailPage /> },
              { path: "blog/:id/edit", element: <ManagerBlogEditorPage /> },
              { path: "alerts", element: <ManagerAlertsPage /> },
              {
                path: "environmental-incidents",
                element: <ManagerEnvironmentalIncidentsPage />,
              },
              { path: "ambient", element: <ManagerAmbientConfigPage /> },
              {
                path: "iot-calibrations",
                element: <ManagerCalibrationsExpiringPage />,
              },
              { path: "profile", element: <ProfilePage /> },
              { path: "settings", element: <AccountSettingsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.STAFF]} />,
        children: [
          {
            path: "/staff",
            element: <AppLayout sections={STAFF_NAV} />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <StaffDashboardPage /> },
              { path: "tickets", element: <StaffTicketListPage /> },
              { path: "tickets/:id", element: <StaffTicketDetailPage /> },
              {
                path: "maintenance-logs",
                element: <StaffMyMaintenanceLogsPage />,
              },
              { path: "kb", element: <StaffKbListPage /> },
              { path: "kb/new", element: <StaffKbEditorPage /> },
              { path: "kb/:id", element: <StaffKbDetailPage /> },
              { path: "kb/:id/edit", element: <StaffKbEditorPage /> },
              { path: "blog", element: <StaffBlogListPage /> },
              { path: "blog/new", element: <StaffBlogEditorPage /> },
              { path: "blog/:id", element: <StaffBlogDetailPage /> },
              { path: "blog/:id/edit", element: <StaffBlogEditorPage /> },
              { path: "sla", element: <StaffSlaMonitorPage /> },
              {
                path: "iot-calibrations",
                element: <StaffIoTCalibrationsPage />,
              },
              // IOT3-66/67
              { path: "iot-devices", element: <StaffIoTDevicesPage /> },
              {
                path: "iot-devices/:id",
                element: <StaffIoTDeviceDetailPage />,
              },
              { path: "alerts", element: <StaffAlertsPage /> },
              { path: "battery-alerts", element: <StaffBatteryAlertsPage /> },
              {
                path: "battery-assets/:id",
                element: <StaffBatteryAssetDetailPage />,
              },
              {
                path: "environmental-incidents",
                element: <StaffEnvironmentalIncidentsPage />,
              },
              { path: "profile", element: <ProfilePage /> },
              { path: "settings", element: <AccountSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/unauthorized" replace />,
  },
]);

export default router;
