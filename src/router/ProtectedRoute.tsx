import { Navigate, Outlet } from "react-router-dom";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { useAuthContext } from "@/shared/context/authContext";
import { Skeleton } from "@/components/ui/skeleton";

function LayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar skeleton */}
      <aside className="w-55 border-r bg-card flex flex-col shrink-0">
        <div className="h-14 border-b px-4 flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex-1 px-3 py-4 space-y-5">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar skeleton */}
        <header className="h-14 border-b bg-card flex items-center px-5 gap-3 shrink-0">
          <div className="flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </header>

        {/* Content skeleton */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </main>
      </div>
    </div>
  );
}

const ProtectedRoute = () => {
  const { isHydrating } = useAuthContext();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  if (isHydrating) return <LayoutSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
