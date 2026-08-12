import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholders shared by the router's Suspense boundaries.
 *
 * Route pages and the role layouts are code-split (see `src/router/index.tsx`), so there is a
 * short window where a chunk is still downloading and nothing can be rendered. These fill it.
 *
 * They live in `shared/` rather than `router/` because `AppLayout` and `AuthLayout` consume
 * them, and the shared layer must not import from the router layer.
 *
 * `LayoutSkeleton` was previously defined inside `ProtectedRoute.tsx`; the markup here is
 * unchanged, so the hydration placeholder and the chunk-loading placeholder are the same
 * pixels. That is deliberate — a user waiting on both sees one continuous skeleton rather
 * than two different ones swapping.
 */

/** Content-area placeholder. Used inside AppLayout, where a sidebar and topbar already exist. */
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
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
    </div>
  );
}

/**
 * Placeholder for the auth card's contents. AuthLayout renders the card box itself
 * (fixed max-width and padding), so only the inner form is skeletonized and the card
 * does not change size when the real page arrives.
 */
export function AuthCardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

/** Full-screen placeholder: sidebar + topbar + content. Used before a role layout exists. */
export default function LayoutSkeleton() {
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
        <main className="flex-1 overflow-y-auto">
          <PageSkeleton />
        </main>
      </div>
    </div>
  );
}
