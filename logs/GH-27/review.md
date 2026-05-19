# BÁO CÁO CODE REVIEW — GH-27: Account Settings — 2026-05-20

## TÓM TẮT
Implement đầy đủ Account Settings: 12 endpoints, 3 schemas Zod, 12 hooks (11 mutation + 1 query), 7 components, 1 page, router wiring. `tsc --noEmit`, `eslint --max-warnings=0`, `npm run build` đều PASS trên toàn branch.

---

## PHÂN TÍCH

### ✅ Pass — Quality gates (shared với toàn branch)

| Kiểm tra | Kết quả |
|----------|---------|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npx eslint src --max-warnings=0` | ✅ 0 warning |
| `npm run build` | ✅ thành công |

### ✅ Pass — GH-27 scope

- 12 hooks đủ theo plan: 11 mutation (useChangePassword, useChangeEmail, useConfirmEmailChange, useSendPhoneOtp, useVerifyPhoneOtp, useEnableTwoFactor, useDisableTwoFactor, useLinkGoogle, useUnlinkGoogle, useDeactivateAccount, useDeleteAccount) + 1 query (useLoginHistory) ✅
- 3 schemas Zod: `change-password.schema.ts`, `change-email.schema.ts`, `confirm-otp.schema.ts` ✅
- 7 components: ChangePasswordForm, ChangeEmailForm, PhoneVerifySection, TwoFactorSetup, GoogleLinkSection, DangerZone, LoginHistoryTable ✅
- `AccountSettingsPage` ghép đủ 7 components ✅
- Route `/settings` dưới `ProtectedRoute` (không RoleRoute) ✅
- No API call trong component ✅
- `account.service.ts` import từ `ENDPOINTS.ACCOUNTS.ME.*` ✅

### 🟡 Warning — Hardcoded props ở AccountSettingsPage

`AccountSettingsPage.tsx` line 18–19: `TwoFactorSetup isEnabled={false}` và `GoogleLinkSection isLinked={false}` — props hardcoded. Đúng theo scope GH-27 (chưa wiring `AccountDto`), nhưng cần ticket riêng để đọc từ profile. Ghi nhớ khi implement ProfilePage.

---

## RỦI RO & LƯU Ý

- Đổi email/mật khẩu → clearSession + navigate('/login') — flow implement đúng trong components (không thể verify không có BE)
- 2FA QR code dùng `qrcode.react` — cần confirm đã cài package
- `console.error` trong `GoogleCallbackPage.tsx` là scope GH-11 (không phải GH-27) — không block

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Tất cả files trong plan đã tạo, types đúng contract, hooks đúng pattern. Sẵn sàng chạy `/kltn-test 27`.
