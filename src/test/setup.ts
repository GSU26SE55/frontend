import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom giữ nguyên document giữa các test trong cùng file, nên phần cây DOM của test trước
// vẫn còn đó và query của test sau có thể bắt trúng nó.
afterEach(() => {
  cleanup();
});
