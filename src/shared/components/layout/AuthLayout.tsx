import { Navigate, Outlet } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { useAuthContext } from "@/shared/context/authContext";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { redirectByRole } from "@/shared/types/session.types";

const AuthLayout = () => {
  const { isHydrating } = useAuthContext();
  const user = useSessionStore((s) => s.user);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  if (!isHydrating && isAuthenticated && user) {
    return <Navigate to={redirectByRole(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.45,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 h-72 w-[600px] rounded-full bg-primary/10 blur-[80px]"
      />

      <div className="relative z-10 mb-7 flex flex-col items-center gap-2">
        <img src={logoImg} alt="Sunaria" className="h-16 w-16 object-contain" />
        <div className="text-center">
          <p className="text-sm font-bold tracking-tight text-foreground">
            Solar Battery Management
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Outlet />
      </div>

      <p className="relative z-10 mt-8 text-xs text-muted-foreground">
        © 2026 Solar Battery Management System. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
