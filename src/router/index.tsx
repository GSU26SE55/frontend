import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import PageLoader from "@/shared/components/layout/PageLoader";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import SmartHome from "./SmartHome";
import { UserRole } from "@/shared/types/account/session.types";
import AuthLayout from "@/shared/components/layout/AuthLayout";

// Everything below is code-split. Static imports here would put all ~100 pages, all four role
// layouts and every dependency they reach (recharts, TipTap, SignalR, anime.js …) into a single
// chunk that the browser must download before it can render /login — which is exactly what this
// app used to do: one 3.5 MB JavaScript file. Each lazy() below becomes its own chunk, fetched
// only when its route is actually visited. The Suspense boundaries that cover them live in
// AppLayout, AuthLayout and ProtectedRoute; layout-less routes carry their own inline.
//
// AuthLayout stays a static import: it is the layout an anonymous visitor needs immediately,
// so splitting it would only add a round-trip to the most common cold entry point.

// Role layouts. AdminAppLayout / StaffAppLayout are thin wrappers in this directory that bind
// AppLayout to a nav config — see the comment in AdminAppLayout.tsx for why the binding cannot
// happen inline in the route table.
const AdminAppLayout = lazy(() => import("./AdminAppLayout"));
const StaffAppLayout = lazy(() => import("./StaffAppLayout"));
const ManagerAppLayout = lazy(
  () => import("@/features/manager/components/layout/ManagerAppLayout"),
);
const RoleAwareAppLayout = lazy(() => import("./RoleAwareAppLayout"));

// Pages.
const GoogleCallbackPage = lazy(() => import("@/features/auth/pages/GoogleCallbackPage"));
const UseMobileAppPage = lazy(() => import("@/features/auth/pages/UseMobileAppPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const Login2faPage = lazy(() => import("@/features/auth/pages/Login2faPage"));
const ReactivatePage = lazy(() => import("@/features/auth/pages/ReactivatePage"));
const CrossDeviceConfirmPage = lazy(() => import("@/features/auth/pages/CrossDeviceConfirmPage"));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage"));
const OtpVerifyPage = lazy(() => import("@/features/auth/pages/OtpVerifyPage"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/ForgotPasswordPage"));
const AcceptInvitePage = lazy(() => import("@/features/auth/pages/AcceptInvitePage"));
const AccountSettingsPage = lazy(() => import("@/features/auth/pages/AccountSettingsPage"));
const NotificationInboxPage = lazy(() => import("@/shared/pages/NotificationInboxPage"));
const NotificationUnsubscribePage = lazy(() => import("@/shared/pages/NotificationUnsubscribePage"));
const ProfilePage = lazy(() => import("@/features/auth/pages/ProfilePage"));
const AuditLogsPage = lazy(() => import("@/features/admin/pages/AuditLogsPage"));
const BatteryAuditLogsPage = lazy(() => import("@/features/admin/pages/BatteryAuditLogsPage"));
const FilesAuditLogsPage = lazy(() => import("@/features/admin/pages/FilesAuditLogsPage"));
const NotificationAdminPage = lazy(() => import("@/features/admin/pages/NotificationAdminPage"));
const NotificationTemplatesPage = lazy(() => import("@/features/admin/pages/NotificationTemplatesPage"));
const NotificationGroupsPage = lazy(() => import("@/features/admin/pages/NotificationGroupsPage"));
const NotificationBatchesPage = lazy(() => import("@/features/admin/pages/NotificationBatchesPage"));
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/DashboardPage"));
const AdminAnalyticsPage = lazy(() => import("@/features/admin/pages/AnalyticsPage"));
const AdminSiteListPage = lazy(() => import("@/features/admin/pages/SiteListPage"));
const AdminSiteDetailPage = lazy(() => import("@/features/admin/pages/SiteDetailPage"));
const BatteryAssetsPage = lazy(() => import("@/features/admin/pages/BatteryAssetsPage"));
const BatteryTypesPage = lazy(() => import("@/features/admin/pages/BatteryTypesPage"));
const BatteryAssetDetailPage = lazy(() => import("@/features/admin/pages/BatteryAssetDetailPage"));
const IoTDevicesPage = lazy(() => import("@/features/admin/pages/IoTDevicesPage"));
const IoTDeviceFormPage = lazy(() => import("@/features/admin/pages/IoTDeviceFormPage"));
const IoTDeviceDetailPage = lazy(() => import("@/features/admin/pages/IoTDeviceDetailPage"));
const IoTFirmwareReleasesPage = lazy(() => import("@/features/admin/pages/IoTFirmwareReleasesPage"));
const IoTFirmwareFormPage = lazy(() => import("@/features/admin/pages/IoTFirmwareFormPage"));
const ManagerCalibrationsExpiringPage = lazy(() => import("@/features/manager/pages/CalibrationsExpiringPage"));
const StaffIoTCalibrationsPage = lazy(() => import("@/features/staff/pages/IoTCalibrationsPage"));
const StaffIoTDevicesPage = lazy(() => import("@/features/staff/pages/IoTDevicesPage"));
const StaffIoTDeviceDetailPage = lazy(() => import("@/features/staff/pages/IoTDeviceDetailPage"));
const AccountsPage = lazy(() => import("@/features/admin/pages/AccountsPage"));
const RolesPage = lazy(() => import("@/features/admin/pages/RolesPage"));
const AdminTicketListPage = lazy(() => import("@/features/admin/pages/AdminTicketListPage"));
const AdminSagaDebugPage = lazy(() => import("@/features/admin/pages/SagaDebugPage"));
const AdminTicketDetailPage = lazy(() => import("@/features/admin/pages/AdminTicketDetailPage"));
const AdminAlertsPage = lazy(() => import("@/features/admin/pages/AlertsPage"));
const AdminEnvironmentalIncidentsPage = lazy(() => import("@/features/admin/pages/EnvironmentalIncidentsPage"));
const AdminAmbientConfigPage = lazy(() => import("@/features/admin/pages/AmbientConfigPage"));
const AdminSmsGatewayPage = lazy(() => import("@/features/admin/pages/SmsGatewayPage"));
const ManagerDashboardPage = lazy(() => import("@/features/manager/pages/DashboardPage"));
const ManagerAnalyticsPage = lazy(() => import("@/features/manager/pages/AnalyticsPage"));
const ManagerSiteListPage = lazy(() => import("@/features/manager/pages/SiteListPage"));
const ManagerSiteDetailPage = lazy(() => import("@/features/manager/pages/SiteDetailPage"));
const ManagerBatteryAssetsPage = lazy(() => import("@/features/manager/pages/BatteryAssetsPage"));
const ManagerBatteryAssetDetailPage = lazy(() => import("@/features/manager/pages/BatteryAssetDetailPage"));
const ManagerTicketListPage = lazy(() => import("@/features/manager/pages/TicketListPage"));
const ManagerTicketQueuePage = lazy(() => import("@/features/manager/pages/TicketQueuePage"));
const ManagerTicketDetailPage = lazy(() => import("@/features/manager/pages/TicketDetailPage"));
const ManagerMergeComparePage = lazy(() => import("@/features/manager/pages/MergeComparePage"));
const ManagerAlertsPage = lazy(() => import("@/features/manager/pages/AlertsPage"));
const ManagerEnvironmentalIncidentsPage = lazy(() => import("@/features/manager/pages/EnvironmentalIncidentsPage"));
const ManagerAmbientConfigPage = lazy(() => import("@/features/manager/pages/AmbientConfigPage"));
const StaffDashboardPage = lazy(() => import("@/features/staff/pages/DashboardPage"));
const StaffTicketListPage = lazy(() => import("@/features/staff/pages/TicketListPage"));
const StaffTicketDetailPage = lazy(() => import("@/features/staff/pages/TicketDetailPage"));
const StaffMyMaintenanceLogsPage = lazy(() => import("@/features/staff/pages/MyMaintenanceLogsPage"));
const StaffSlaMonitorPage = lazy(() => import("@/features/staff/pages/SlaMonitorPage"));
const StaffAlertsPage = lazy(() => import("@/features/staff/pages/AlertsPage"));
const AdminKbListPage = lazy(() => import("@/features/admin/pages/KbListPage"));
const AdminKbDetailPage = lazy(() => import("@/features/admin/pages/KbDetailPage"));
const AdminKbEditorPage = lazy(() => import("@/features/admin/pages/KbEditorPage"));
const ManagerKbListPage = lazy(() => import("@/features/manager/pages/KbListPage"));
const ManagerKbDetailPage = lazy(() => import("@/features/manager/pages/KbDetailPage"));
const ManagerKbEditorPage = lazy(() => import("@/features/manager/pages/KbEditorPage"));
const StaffKbListPage = lazy(() => import("@/features/staff/pages/KbListPage"));
const StaffKbDetailPage = lazy(() => import("@/features/staff/pages/KbDetailPage"));
const StaffKbEditorPage = lazy(() => import("@/features/staff/pages/KbEditorPage"));
const AdminBlogListPage = lazy(() => import("@/features/admin/pages/BlogListPage"));
const AdminBlogDetailPage = lazy(() => import("@/features/admin/pages/BlogDetailPage"));
const AdminBlogEditorPage = lazy(() => import("@/features/admin/pages/BlogEditorPage"));
const ManagerBlogListPage = lazy(() => import("@/features/manager/pages/BlogListPage"));
const ManagerBlogDetailPage = lazy(() => import("@/features/manager/pages/BlogDetailPage"));
const ManagerBlogEditorPage = lazy(() => import("@/features/manager/pages/BlogEditorPage"));
const StaffBlogListPage = lazy(() => import("@/features/staff/pages/BlogListPage"));
const StaffBlogDetailPage = lazy(() => import("@/features/staff/pages/BlogDetailPage"));
const StaffBlogEditorPage = lazy(() => import("@/features/staff/pages/BlogEditorPage"));
const StaffBatteryAlertsPage = lazy(() => import("@/features/staff/pages/BatteryAlertsPage"));
const StaffBatteryAssetDetailPage = lazy(() => import("@/features/staff/pages/BatteryAssetDetailPage"));
const StaffEnvironmentalIncidentsPage = lazy(() => import("@/features/staff/pages/EnvironmentalIncidentsPage"));

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
  // The next three routes render without any layout, so they carry their own Suspense
  // boundary — there is no parent <Outlet/> to host one.
  {
    path: "/auth/google/callback",
    element: (
      <Suspense fallback={<PageLoader />}>
        <GoogleCallbackPage />
      </Suspense>
    ),
  },
  {
    // CUSTOMER login on web → redirected here (web not supported, use the Mobile App)
    path: "/use-mobile-app",
    element: (
      <Suspense fallback={<PageLoader />}>
        <UseMobileAppPage />
      </Suspense>
    ),
  },
  {
    path: "/notification-unsubscribe",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotificationUnsubscribePage />
      </Suspense>
    ),
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
        // (and therefore its Suspense boundary, so it needs its own).
        path: "/2fa/cross-device-confirm",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CrossDeviceConfirmPage />
          </Suspense>
        ),
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
        children: [
          {
            path: "/admin",
            element: <AdminAppLayout />,
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
            element: <StaffAppLayout />,
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
