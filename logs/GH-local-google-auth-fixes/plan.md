# Plan — local: Sửa lỗi Google Login & Link Account

## Metadata
- **Status:** DONE | **Role:** FE | **Ngày:** 2026-07-10
- **Issue:** local (không có số GH — sửa lỗi Google Auth & Link)

## Mục tiêu
Khắc phục các lỗi cấu hình và truyền tải token để luồng đăng nhập Google và liên kết tài khoản Google chạy ổn định trong môi trường local (Cross-Origin).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/auth/components/GoogleLinkSection.tsx` | modify | Chuyển sang `<GoogleLogin>` để lấy chính xác JWT ID Token thay vì Access Token |
| `src/features/auth/services/auth.service.ts` | modify | Thêm `withCredentials: true` khi gọi `googleCallback` |
| `.env` | modify | Cập nhật Client ID và Redirect URI chuẩn |

## Các thay đổi chi tiết

### 1. Đồng bộ cấu hình môi trường (.env)
* Cập nhật `VITE_GOOGLE_CLIENT_ID` sang Client ID thực tế trùng khớp với Backend: `85758470906-dhc3h3iiv52o77g7a8odqti5316j67cc.apps.googleusercontent.com`.

### 2. Sửa luồng lấy Token Liên kết tài khoản (Link Account)
* Đổi cơ chế lấy mã xác thực trong `GoogleLinkSection.tsx` từ hook `useGoogleLogin()` (trả về Access Token thông thường) sang dùng component `<GoogleLogin>` của thư viện `@react-oauth/google`. Điều này đảm bảo FE lấy được đúng JWT ID Token thông qua `credentialResponse.credential` để truyền vào payload của mutation `linkGoogle`.

### 3. Sửa lỗi thiếu cookie xác thực (invalid_state) khi chạy Cross-Origin
* Thêm tùy chọn `{ withCredentials: true }` vào request Axios trong `authService.googleCallback`. Việc này đảm bảo trình duyệt sẽ đính kèm cookie `g_oauth_state` (HttpOnly) khi gọi API từ origin của FE (`localhost:5173`) sang BE (`localhost:4001`), tránh lỗi `401 invalid_state` từ máy chủ.

## Các bước thực hiện & Kết quả
- [x] Cập nhật `.env` của Frontend và Backend đồng bộ
- [x] Chuyển đổi cơ chế lấy ID Token JWT trong `GoogleLinkSection`
- [x] Thêm `withCredentials: true` vào `googleCallback` Axios request
- [x] Chạy lệnh `pnpm run build` kiểm tra biên dịch hệ thống → **PASS**
