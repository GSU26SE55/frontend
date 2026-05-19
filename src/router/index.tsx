import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { UserRole } from "@/shared/types/session.types";
import LandingPage from "@/features/landing/pages/LandingPage";
import GoogleCallbackPage from "@/features/auth/pages/GoogleCallbackPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
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
      {
        element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
        children: [{ path: "/admin/*", element: <div>Admin Portal</div> }],
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.MANAGER]} />,
        children: [{ path: "/manager/*", element: <div>Manager Portal</div> }],
      },
      {
        element: <RoleRoute allowedRoles={[UserRole.STAFF]} />,
        children: [{ path: "/staff/*", element: <div>Staff Portal</div> }],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
