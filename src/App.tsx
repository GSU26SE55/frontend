import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/shared/context/authContext";
import { env } from "@/config/env";
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
      Date.now() - ((window as unknown as Record<string, number>).__splashStart || 0);
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
  <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <RouterProvider router={router} />
          <ThemedToaster />
          <DismissSplash />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
