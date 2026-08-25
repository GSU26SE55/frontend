import { Loader2 } from "lucide-react";

/**
 * Minimal full-screen spinner, for routes that render without any layout around them
 * (the landing page, the Google OAuth callback, the unsubscribe page, …). Those have no
 * sidebar or card to skeletonize, so a plain centered spinner is the honest placeholder.
 *
 * Moved out of `SmartHome.tsx` so the router's Suspense boundaries can share one copy.
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    {/* The same Loader2 the other 50-odd loading states use. A hand-rolled border-b
        circle span spinning at a different rate read as a second, unrelated spinner. */}
    <Loader2 className="size-8 animate-spin text-primary" />
  </div>
);

export default PageLoader;
