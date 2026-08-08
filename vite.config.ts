import path from "path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Proxy /api → API gateway so the FE and API share an origin (localhost:5173) in dev.
  // Needed for the Google OAuth flow: the g_oauth_state cookie (SameSite=Lax) is only
  // sent when the callback XHR is same-origin. Target comes from VITE_DEV_API_TARGET
  // (default 4001).
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
});
