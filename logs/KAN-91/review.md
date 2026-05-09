# BÁO CÁO CODE REVIEW — feature/KAN-91-fe-scaffold — 2026-05-09

## TÓM TẮT
Scaffold FE có cấu trúc tốt, tuân thủ đầy đủ rules trong `tech/fe.md`. Không có lỗi Critical breaking. 3 warnings nhỏ đã được sửa ngay trong session review.

---

## PHÂN TÍCH

### 🔴 Critical
Không có.

---

### 🟡 Warning (đã sửa)

**W1 — `staffNav` duplicate route** (`src/shared/components/layout/Sidebar.tsx`)
- 2 nav items trỏ cùng `/staff/tickets` (label "Ticket của tôi" và "Công việc")
- **Fix:** Xoá nav item thừa, giữ lại "Ticket của tôi". Detail view truy cập qua `/staff/tickets/:id`.

**W2 — `refreshToken` undefined không được guard** (`src/shared/lib/axios.ts:48`)
- `Cookies.get('refreshToken')` có thể trả `undefined`, code vẫn POST lên server
- **Fix:** Thêm `if (!refreshToken) throw new Error('No refresh token')` trước khi gọi `/auth/refresh`

**W3 — Dead files không nên commit**
- `src/App.css` — không được import trong App.tsx mới
- `README copy.md` — file thừa từ quá trình dev
- **Fix:** Đã xoá cả hai file.

---

### ✅ Pass

| Rule (từ fe.md) | Trạng thái |
|-----------------|-----------|
| Không gọi API trong component — qua `services/` → TanStack Query hook | ✅ |
| Không dùng `localStorage` cho token — cookie only (js-cookie) | ✅ |
| Không hardcode URL — dùng `env.VITE_API_BASE_URL` | ✅ |
| Zustand chỉ cho auth session, không làm server state cache | ✅ |
| `useState` không dùng sai mục đích | ✅ |
| Feature isolation: ESLint `no-restricted-imports` scoped đúng theo directory | ✅ |
| Axios: 1 instance duy nhất, refresh queue pattern tránh infinite loop | ✅ |
| TanStack Query defaults đúng spec (staleTime 2m, gcTime 10m, retry 1, refetchOnWindowFocus false) | ✅ |
| Env validation Zod throw sớm khi boot thiếu biến | ✅ |
| Path alias `@/` config đúng (vite.config.ts + tsconfig.app.json) | ✅ |
| Naming conventions: PascalCase pages, `use*` hooks, `*.service.ts` | ✅ |
| Token storage: cookie qua `js-cookie`, không dùng `localStorage` | ✅ |
| AuthProvider: hydrate từ cookie khi boot + check `exp` trước khi set session | ✅ |
| Tailwind v4 + `@theme` color mapping (không dùng `@apply` với biến chưa khai báo) | ✅ |
| ESLint + TypeScript check PASS qua pre-commit hook | ✅ |

---

## RỦI RO & LƯU Ý

- **Race condition nhỏ (AuthProvider):** `ProtectedRoute` đọc Zustand trước khi `useEffect` của `AuthProvider` chạy. Khi F5 với token hợp lệ có thể flash redirect về `/login` rồi tự resolve. Acceptable ở scope scaffold — fix khi implement LoginPage (thêm `isHydrating` loading state).
- **`AuthContext` value là `null`:** Context không expose gì ra ngoài, chỉ dùng để cấu trúc Provider. Đủ cho scope này; refactor nếu cần expose `isLoading` ở ticket sau.
- **Bundle size 393 KB:** Chấp nhận được. Nếu cần tối ưu: dùng `React.lazy` + `Suspense` per route.

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Tất cả 3 warnings đã được sửa và commit (`fix(KAN-91): sửa warnings từ code review`). Sẵn sàng cho `/kltn-test` và `/kltn-ship`.
