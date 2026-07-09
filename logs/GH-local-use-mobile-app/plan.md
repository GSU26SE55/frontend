# Plan — local: Redirect CUSTOMER sang trang "dùng Mobile App"

## Metadata
- **Status:** DONE | **Role:** FE | **Ngày:** 2026-07-09
- **Issue:** local (không có số GH — task nội bộ)

## Mục tiêu
Tài khoản CUSTOMER không dùng web portal. Trước đây login CUSTOMER → `/unauthorized`
(thông báo lỗi cụt). Thay bằng trang `UseMobileAppPage` hướng dẫn dùng Mobile App —
áp dụng cho MỌI luồng login (thường / 2FA / accept-invite / Google callback).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/auth/pages/UseMobileAppPage.tsx` | create | Trang hướng dẫn CUSTOMER dùng mobile |
| `src/shared/types/session.types.ts` | modify | `redirectByRole` CUSTOMER → `/use-mobile-app` |
| `src/router/index.tsx` | modify | Route `/use-mobile-app` |
| `src/features/auth/hooks/useLogin.ts` | modify | Điều hướng CUSTOMER về use-mobile-app |
| `src/features/auth/hooks/useVerify2faLogin.ts` | modify | Tương tự cho luồng 2FA |
| `src/features/auth/hooks/useAcceptInvite.ts` | modify | Tương tự cho invite |
| `src/features/auth/pages/GoogleCallbackPage.tsx` | modify | Tương tự cho Google callback |
| `vite.config.ts` | modify | Config tweak |

## Steps
- [x] UseMobileAppPage + route
- [x] redirectByRole CUSTOMER → /use-mobile-app
- [x] Áp dụng 4 luồng login (thường / 2FA / invite / Google)
- [x] tsc + eslint PASS
