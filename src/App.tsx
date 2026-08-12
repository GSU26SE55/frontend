import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/shared/context/authContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import router from "@/router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      richColors
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}

function DismissSplash() {
  useEffect(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    const elapsed =
      Date.now() -
      ((window as unknown as Record<string, number>).__splashStart || 0);
    const remaining = Math.max(0, 2200 - elapsed);
    const timer = setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => splash.remove(), 500);
    }, remaining);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

const App = () => (
  // GoogleOAuthProvider is intentionally NOT here: mounting it app-wide loads the
  // ~96 KiB accounts.google.com/gsi/client script on every page — including the public
  // landing page, which has no Google button. It now wraps only the one place that
  // renders <GoogleLogin> (GoogleLinkSection on the profile page).
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TooltipProvider>
          {/* Safety net: routes and layouts are code-split, and React throws if a
              component suspends with no boundary above it. Every route already has a
              closer boundary that renders a real placeholder, so this one should never
              be seen — hence fallback={null}, which also leaves the index.html splash
              (z-index 9999) visible underneath rather than flashing a second loader. */}
          <Suspense fallback={null}>
            <RouterProvider router={router} />
          </Suspense>
          <ThemedToaster />
          <DismissSplash />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
