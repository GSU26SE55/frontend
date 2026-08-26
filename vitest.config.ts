import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Cấu hình riêng, không dùng lại vite.config.ts: bản build có thêm preset React Compiler
// chạy qua Babel, khiến mỗi file nguồn bị phân tích hai lần và chiếm phần lớn thời gian
// build. Với test thì cái giá đó không đổi lại được gì — React Compiler chỉ tối ưu lúc
// chạy thật, không đổi hành vi mà test quan sát.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/shared/lib/**",
        "src/shared/utils/**",
        "src/shared/types/**",
      ],
    },
  },
});
