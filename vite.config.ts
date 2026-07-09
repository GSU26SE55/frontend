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
  // Proxy /api → API gateway để FE và API cùng origin (localhost:5173) trong dev.
  // Cần cho luồng Google OAuth: cookie g_oauth_state (SameSite=Lax) chỉ được gửi kèm
  // khi callback XHR same-origin. Đích lấy từ VITE_DEV_API_TARGET (mặc định 4001).
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
});
