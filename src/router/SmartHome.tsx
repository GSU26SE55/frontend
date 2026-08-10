import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/shared/context/authContext";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { redirectByRole } from "@/shared/types/account/session.types";
import PageLoader from "@/shared/components/layout/PageLoader";

// Code-split: the landing page drags in anime.js and every landing image, none of which an
// authenticated user hitting "/" (and being redirected straight to their role home) will ever
// need. SmartHome itself stays eager — it is a few lines and only reads the session store.
const LandingPage = lazy(() => import("@/features/landing/pages/LandingPage"));

const SmartHome = () => {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  if (isHydrating) return <PageLoader />;
  if (isAuthenticated && user)
    return <Navigate to={redirectByRole(user.role)} replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  );
};

export default SmartHome;
