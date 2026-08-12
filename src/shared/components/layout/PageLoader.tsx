/**
 * Minimal full-screen spinner, for routes that render without any layout around them
 * (the landing page, the Google OAuth callback, the unsubscribe page, …). Those have no
 * sidebar or card to skeletonize, so a plain centered spinner is the honest placeholder.
 *
 * Moved out of `SmartHome.tsx` so the router's Suspense boundaries can share one copy.
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
  </div>
);

export default PageLoader;
