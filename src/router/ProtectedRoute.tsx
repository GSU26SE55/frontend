import { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { useAuthContext } from "@/shared/context/authContext";
import LayoutSkeleton from "@/shared/components/layout/LayoutSkeleton";

const ProtectedRoute = () => {
  const { isHydrating } = useAuthContext();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  if (isHydrating) return <LayoutSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // The role layouts below this point are code-split, so the same skeleton covers both
  // waits — session hydration and the layout chunk — and the user sees one continuous
  // placeholder instead of two different ones swapping.
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <Outlet />
    </Suspense>
  );
};

export default ProtectedRoute;
