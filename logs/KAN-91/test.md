## TEST REPORT — KAN-91 — 2026-05-02

### TÓM TẮT
KAN-91 là FE scaffold cho ReactJS app shell. Build, lint và kiểm tra route dev server đều PASS; không phát hiện lỗi blocking cho scope scaffold.

### Scope: FE

| Test case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| Build production | `VITE_API_BASE_URL=http://localhost:5000 npm --prefix code run build` | TypeScript build và Vite build thành công | Build thành công, bundle generated | ✅ PASS |
| Lint | `npm --prefix code run lint` | Không có lỗi ESLint | Không có lỗi ESLint | ✅ PASS |
| Dev server boot | `VITE_API_BASE_URL=http://localhost:5000 npm --prefix code run dev -- --host 127.0.0.1` | Vite server chạy local | Server chạy và phục vụ route | ✅ PASS |
| Root route | GET `http://127.0.0.1:5173/` | HTTP 200, app root và module entry tồn tại | 200, `#root` và `/src/main.tsx` tồn tại | ✅ PASS |
| Login route | GET `http://127.0.0.1:5173/login` | HTTP 200, app root và module entry tồn tại | 200, `#root` và `/src/main.tsx` tồn tại | ✅ PASS |
| Unauthorized route | GET `http://127.0.0.1:5173/unauthorized` | HTTP 200, app root và module entry tồn tại | 200, `#root` và `/src/main.tsx` tồn tại | ✅ PASS |
| Admin route shell | GET `http://127.0.0.1:5173/admin` | HTTP 200 từ SPA fallback, app root và module entry tồn tại | 200, `#root` và `/src/main.tsx` tồn tại | ✅ PASS |
| Manager route shell | GET `http://127.0.0.1:5173/manager` | HTTP 200 từ SPA fallback, app root và module entry tồn tại | 200, `#root` và `/src/main.tsx` tồn tại | ✅ PASS |
| Staff route shell | GET `http://127.0.0.1:5173/staff` | HTTP 200 từ SPA fallback, app root và module entry tồn tại | 200, `#root` và `/src/main.tsx` tồn tại | ✅ PASS |
| Auth/session storage rule | Code inspection | Không dùng `localStorage`; auth qua cookie + Zustand | `authContext.tsx` dùng `js-cookie`, `sessionStore.ts` dùng Zustand | ✅ PASS |
| API access rule | Code inspection | Không gọi API trực tiếp trong page scaffold | Placeholder pages không gọi API; Axios tập trung tại `shared/lib/axios.ts` | ✅ PASS |

### Bugs tìm được
- Không có bug blocking trong phạm vi KAN-91.

### RỦI RO & LƯU Ý
- Login UI hiện là placeholder disabled form; login thật thuộc ticket auth sau.
- Chưa có browser automation tool trong phiên này, nên UI render/redirect được kiểm tra qua build + dev server HTTP route availability, chưa kiểm tra console runtime bằng browser thật.
- `VITE_API_BASE_URL` là biến môi trường bắt buộc; local dev cần tạo `.env` từ `code/.env.example` hoặc set env khi chạy.

### KẾT LUẬN
PASS — Độ tin cậy: Cao
