import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/shared/context/authContext";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { redirectByRole } from "@/shared/types/session.types";
import LandingPage from "@/features/landing/pages/LandingPage";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
  </div>
);

const SmartHome = () => {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  if (isHydrating) return <PageLoader />;
  if (isAuthenticated && user)
    return <Navigate to={redirectByRole(user.role)} replace />;
  return <LandingPage />;
};

export default SmartHome;
