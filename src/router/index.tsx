import { Suspense } from "react";
import { lazyPage } from "./lazyPage";
import { createBrowserRouter, Navigate } from "react-router-dom";
import PageLoader from "@/shared/components/layout/PageLoader";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import SmartHome from "./SmartHome";
import { UserRole } from "@/shared/types/account/session.types";
import AuthLayout from "@/shared/components/layout/AuthLayout";
import ErrorPage from "@/shared/components/layout/ErrorPage";

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
const AdminAppLayout = lazyPage(() => import("./AdminAppLayout"));
const StaffAppLayout = lazyPage(() => import("./StaffAppLayout"));
const ManagerAppLayout = lazyPage(
  () => import("@/features/manager/components/layout/ManagerAppLayout"),
);

// Pages.
const GoogleCallbackPage = lazyPage(
  () => import("@/features/auth/pages/GoogleCallbackPage"),
);
const UseMobileAppPage = lazyPage(
  () => import("@/features/auth/pages/UseMobileAppPage"),
);
const LoginPage = lazyPage(() => import("@/features/auth/pages/LoginPage"));
const Login2faPage = lazyPage(
  () => import("@/features/auth/pages/Login2faPage"),
);
const ReactivatePage = lazyPage(
  () => import("@/features/auth/pages/ReactivatePage"),
);
const CrossDeviceConfirmPage = lazyPage(
  () => import("@/features/auth/pages/CrossDeviceConfirmPage"),
);
const RegisterPage = lazyPage(
  () => import("@/features/auth/pages/RegisterPage"),
);
const OtpVerifyPage = lazyPage(
  () => import("@/features/auth/pages/OtpVerifyPage"),
);
const ForgotPasswordPage = lazyPage(
  () => import("@/features/auth/pages/ForgotPasswordPage"),
);
const AcceptInvitePage = lazyPage(
  () => import("@/features/auth/pages/AcceptInvitePage"),
);
const AccountSettingsPage = lazyPage(
  () => import("@/features/auth/pages/AccountSettingsPage"),
);
const NotificationInboxPage = lazyPage(
  () => import("@/shared/pages/NotificationInboxPage"),
);
const NotificationUnsubscribePage = lazyPage(
  () => import("@/shared/pages/NotificationUnsubscribePage"),
);
const AuditLogsPage = lazyPage(
  () => import("@/features/admin/pages/AuditLogsPage"),
);
const BatteryAuditLogsPage = lazyPage(
  () => import("@/features/admin/pages/BatteryAuditLogsPage"),
);
const FilesAuditLogsPage = lazyPage(
  () => import("@/features/admin/pages/FilesAuditLogsPage"),
);
const NotificationAdminPage = lazyPage(
  () => import("@/features/admin/pages/NotificationAdminPage"),
);
const NotificationTemplatesPage = lazyPage(
  () => import("@/features/admin/pages/NotificationTemplatesPage"),
);
const NotificationGroupsPage = lazyPage(
  () => import("@/features/admin/pages/NotificationGroupsPage"),
);
const NotificationBatchesPage = lazyPage(
  () => import("@/features/admin/pages/NotificationBatchesPage"),
);
const AdminDashboardPage = lazyPage(
  () => import("@/features/admin/pages/DashboardPage"),
);
const AdminAnalyticsPage = lazyPage(
  () => import("@/features/admin/pages/AnalyticsPage"),
);
const AdminSiteListPage = lazyPage(
  () => import("@/features/admin/pages/SiteListPage"),
);
const AdminSiteDetailPage = lazyPage(
  () => import("@/features/admin/pages/SiteDetailPage"),
);
const BatteryAssetsPage = lazyPage(
  () => import("@/features/admin/pages/BatteryAssetsPage"),
);
const BatteryTypesPage = lazyPage(
  () => import("@/features/admin/pages/BatteryTypesPage"),
);
const BatteryAssetDetailPage = lazyPage(
  () => import("@/features/admin/pages/BatteryAssetDetailPage"),
);
const IoTDevicesPage = lazyPage(
  () => import("@/features/admin/pages/IoTDevicesPage"),
);
const DataImportPage = lazyPage(
  () => import("@/features/admin/pages/DataImportPage"),
);
const IoTDeviceFormPage = lazyPage(
  () => import("@/features/admin/pages/IoTDeviceFormPage"),
);
const IoTDeviceDetailPage = lazyPage(
  () => import("@/features/admin/pages/IoTDeviceDetailPage"),
);
const IoTFirmwareReleasesPage = lazyPage(
  () => import("@/features/admin/pages/IoTFirmwareReleasesPage"),
);
const IoTFirmwareFormPage = lazyPage(
  () => import("@/features/admin/pages/IoTFirmwareFormPage"),
);
const ManagerCalibrationsExpiringPage = lazyPage(
  () => import("@/features/manager/pages/CalibrationsExpiringPage"),
);
const StaffIoTCalibrationsPage = lazyPage(
  () => import("@/features/staff/pages/IoTCalibrationsPage"),
);
const StaffIoTDevicesPage = lazyPage(
  () => import("@/features/staff/pages/IoTDevicesPage"),
);
const StaffIoTDeviceDetailPage = lazyPage(
  () => import("@/features/staff/pages/IoTDeviceDetailPage"),
);
const AccountsPage = lazyPage(
  () => import("@/features/admin/pages/AccountsPage"),
);
const RolesPage = lazyPage(() => import("@/features/admin/pages/RolesPage"));
const AdminTicketListPage = lazyPage(
  () => import("@/features/admin/pages/AdminTicketListPage"),
);
const AdminSagaDebugPage = lazyPage(
  () => import("@/features/admin/pages/SagaDebugPage"),
);
const AdminTicketDetailPage = lazyPage(
  () => import("@/features/admin/pages/AdminTicketDetailPage"),
);
const AdminAlertsPage = lazyPage(
  () => import("@/features/admin/pages/AlertsPage"),
);
const AdminDeviceAlertsPage = lazyPage(
  () => import("@/features/admin/pages/DeviceAlertsPage"),
);
const AdminEnvironmentalIncidentsPage = lazyPage(
  () => import("@/features/admin/pages/EnvironmentalIncidentsPage"),
);
const AdminSmsGatewayPage = lazyPage(
  () => import("@/features/admin/pages/SmsGatewayPage"),
);
const ManagerDashboardPage = lazyPage(
  () => import("@/features/manager/pages/DashboardPage"),
);
const ManagerAnalyticsPage = lazyPage(
  () => import("@/features/manager/pages/AnalyticsPage"),
);
const ManagerSiteListPage = lazyPage(
  () => import("@/features/manager/pages/SiteListPage"),
);
const ManagerSiteDetailPage = lazyPage(
  () => import("@/features/manager/pages/SiteDetailPage"),
);
const ManagerBatteryAssetsPage = lazyPage(
  () => import("@/features/manager/pages/BatteryAssetsPage"),
);
const ManagerBatteryAssetDetailPage = lazyPage(
  () => import("@/features/manager/pages/BatteryAssetDetailPage"),
);
const ManagerTicketListPage = lazyPage(
  () => import("@/features/manager/pages/TicketListPage"),
);
const ManagerTicketQueuePage = lazyPage(
  () => import("@/features/manager/pages/TicketQueuePage"),
);
const ManagerTicketDetailPage = lazyPage(
  () => import("@/features/manager/pages/TicketDetailPage"),
);
const ManagerMergeComparePage = lazyPage(
  () => import("@/features/manager/pages/MergeComparePage"),
);
const ManagerAlertsPage = lazyPage(
  () => import("@/features/manager/pages/AlertsPage"),
);
const ManagerDeviceAlertsPage = lazyPage(
  () => import("@/features/manager/pages/DeviceAlertsPage"),
);
const ManagerEnvironmentalIncidentsPage = lazyPage(
  () => import("@/features/manager/pages/EnvironmentalIncidentsPage"),
);
const StaffDashboardPage = lazyPage(
  () => import("@/features/staff/pages/DashboardPage"),
);
const StaffTicketListPage = lazyPage(
  () => import("@/features/staff/pages/TicketListPage"),
);
const StaffTicketDetailPage = lazyPage(
  () => import("@/features/staff/pages/TicketDetailPage"),
);
const StaffMyMaintenanceLogsPage = lazyPage(
  () => import("@/features/staff/pages/MyMaintenanceLogsPage"),
);
const StaffSlaMonitorPage = lazyPage(
  () => import("@/features/staff/pages/SlaMonitorPage"),
);
// SLA business calendar — Manager and Admin manage the same list (the BE authorises both),
// so each portal points at its own thin page over one shared view.
const AdminSlaCalendarPage = lazyPage(
  () => import("@/features/admin/pages/SlaCalendarPage"),
);
const ManagerSlaCalendarPage = lazyPage(
  () => import("@/features/manager/pages/SlaCalendarPage"),
);
const AdminKbListPage = lazyPage(
  () => import("@/features/admin/pages/KbListPage"),
);
const AdminKbDetailPage = lazyPage(
  () => import("@/features/admin/pages/KbDetailPage"),
);
const AdminKbEditorPage = lazyPage(
  () => import("@/features/admin/pages/KbEditorPage"),
);
const ManagerKbListPage = lazyPage(
  () => import("@/features/manager/pages/KbListPage"),
);
const ManagerKbDetailPage = lazyPage(
  () => import("@/features/manager/pages/KbDetailPage"),
);
const ManagerKbEditorPage = lazyPage(
  () => import("@/features/manager/pages/KbEditorPage"),
);
const StaffKbListPage = lazyPage(
  () => import("@/features/staff/pages/KbListPage"),
);
const StaffKbDetailPage = lazyPage(
  () => import("@/features/staff/pages/KbDetailPage"),
);
const StaffKbEditorPage = lazyPage(
  () => import("@/features/staff/pages/KbEditorPage"),
);
const AdminBlogListPage = lazyPage(
  () => import("@/features/admin/pages/BlogListPage"),
);
const AdminBlogDetailPage = lazyPage(
  () => import("@/features/admin/pages/BlogDetailPage"),
);
const AdminBlogEditorPage = lazyPage(
  () => import("@/features/admin/pages/BlogEditorPage"),
);
const ManagerBlogListPage = lazyPage(
  () => import("@/features/manager/pages/BlogListPage"),
);
const ManagerBlogDetailPage = lazyPage(
  () => import("@/features/manager/pages/BlogDetailPage"),
);
const ManagerBlogEditorPage = lazyPage(
  () => import("@/features/manager/pages/BlogEditorPage"),
);
const StaffBlogListPage = lazyPage(
  () => import("@/features/staff/pages/BlogListPage"),
);
const StaffBlogDetailPage = lazyPage(
  () => import("@/features/staff/pages/BlogDetailPage"),
);
const StaffBlogEditorPage = lazyPage(
  () => import("@/features/staff/pages/BlogEditorPage"),
);
const StaffBatteryAssetDetailPage = lazyPage(
  () => import("@/features/staff/pages/BatteryAssetDetailPage"),
);

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
      <ErrorPage
        code="403"
        message="You do not have permission to access this page."
        tone="destructive"
      />
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
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
              { path: "data-import", element: <DataImportPage /> },
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
              { path: "device-alerts", element: <AdminDeviceAlertsPage /> },
              { path: "sms-gateway", element: <AdminSmsGatewayPage /> },
              { path: "sagas", element: <AdminSagaDebugPage /> },
              { path: "sla-calendar", element: <AdminSlaCalendarPage /> },
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
              { path: "inbox", element: <NotificationInboxPage /> },
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
              {
                path: "tickets/queue/:id",
                element: <ManagerTicketDetailPage />,
              },
              { path: "tickets/:id", element: <ManagerTicketDetailPage /> },
              {
                path: "tickets/:id/merge",
                element: <ManagerMergeComparePage />,
              },
              { path: "sla-calendar", element: <ManagerSlaCalendarPage /> },
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
              { path: "device-alerts", element: <ManagerDeviceAlertsPage /> },
              {
                path: "iot-calibrations",
                element: <ManagerCalibrationsExpiringPage />,
              },
              { path: "settings", element: <AccountSettingsPage /> },
              { path: "inbox", element: <NotificationInboxPage /> },
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
              {
                path: "battery-assets/:id",
                element: <StaffBatteryAssetDetailPage />,
              },
              { path: "settings", element: <AccountSettingsPage /> },
              { path: "inbox", element: <NotificationInboxPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    // An unmatched path is a wrong address, NOT a permission failure. Sending it to
    // /unauthorized told a full-rights Admin who mistyped a URL that they were denied
    // access to a page that does not exist — hiding the typo behind an access error.
    path: "*",
    element: <ErrorPage code="404" message="This page does not exist." />,
  },
]);

export default router;
