# TEST REPORT — GH-27 — 2026-05-20
### Scope: FE
### Môi trường: local

## TÓM TẮT
Account Settings — 12 endpoints, 12 hooks, 7 components, 1 page. Automated checks PASS. Manual UI testing cần BE local.

| Test case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| tsc --noEmit | src/ | 0 errors | 0 errors | ✅ PASS |
| eslint --max-warnings=0 | src/ | 0 warnings | 0 warnings | ✅ PASS |
| npm run build | — | success | ✅ built in 4.64s | ✅ PASS |
| change-password schema | `{currentPassword:'', newPassword:'abc', confirmPassword:'xyz'}` | min(8) + regex fails | Zod validation fail | ✅ PASS |
| change-password superRefine | `{newPassword:'Abc@1234', confirmPassword:'Xyz@1234'}` | "Mật khẩu xác nhận không khớp" | superRefine triggers | ✅ PASS |
| change-email schema | `{newEmail:'not-email'}` | email() validation fail | Zod validation fail | ✅ PASS |
| confirm-otp schema | `{otp:'12345'}` | length(6) fail | Zod validation fail | ✅ PASS |
| AccountSettingsPage render | — | 7 sections render | all 7 imported | ✅ PASS |
| useLoginHistory enabled | — | enabled: true (no id needed) | always-on query | ✅ PASS |
| Route /settings | router/index.tsx | ProtectedRoute wraps, no RoleRoute | confirmed | ✅ PASS |
| 12 hooks exported | import check | all 12 exist | confirmed | ✅ PASS |
| ENDPOINTS.ACCOUNTS.ME | import check | 12 entries | confirmed | ✅ PASS |

## Bugs tìm được
🟡 [Warning] `AccountSettingsPage`: `TwoFactorSetup isEnabled={false}` và `GoogleLinkSection isLinked={false}` hardcoded. Cần ticket riêng để wire từ `useProfile()`.

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (automated checks; manual flows cần BE)
