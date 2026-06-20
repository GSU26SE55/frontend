# Plan — GH-88: [FE] Auth nâng cao — Trusted Devices, 2FA fallback/cross-device, Reactivate, GDPR export, Admin merge

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-20
- **Issue:** #88 — https://github.com/GSU26SE55/frontend/issues/88
- **Sprint:** Sprint 3 (current, due 2026-06-27)
- **Dev:** Trần Minh Trí (SE183109)

> **BE source verified** (`services/AuthService`, không phải "UserService"): tất cả request/response shape dưới đây đã đối chiếu C# command/DTO thật, không chỉ doc.

## Mục tiêu
Implement FE cho **10 endpoint** `api-auth` chưa có UI, gom thành **5 nhóm tính năng**, ship trong **1 PR lớn**:
Trusted Devices · 2FA nâng cao (SMS fallback + cross-device setup) · Reactivate account · GDPR export · Admin merge.

## Scope
**Trong scope (10 endpoint / 5 nhóm):**
1. **Trusted Devices** (#AUTH-48) — `GET /me/trusted-devices`, `DELETE /me/trusted-devices/{id}`, `DELETE /me/trusted-devices`. UI section "Thiết bị tin cậy" trong `AccountSettingsPage`.
2. **2FA SMS fallback + Trust device** (#AUTH-58, #AUTH-48) — `POST /auth/login/2fa/sms`. Nút "Không có Authenticator? Gửi OTP qua SMS" + **checkbox "Tin tưởng thiết bị này" + input label** trong `Login2faPage` (BE `Verify2FALoginCommand` có `TrustDevice`/`TrustDeviceLabel` — đây là cách device được thêm vào trusted list).
3. **Cross-device 2FA setup** (#AUTH-51) — `POST /auth/2fa/cross-device-confirm/request` (Device A) + `POST /auth/2fa/cross-device-confirm` (Device B). UI trong `TwoFactorSetup` + page mới `/2fa/cross-device-confirm`.
4. **Reactivate account** (#AUTH-50) — `POST /auth/reactivate-request` + `POST /auth/reactivate-verify`. Page mới `/reactivate` (2 bước) + link ở `LoginPage`.
5. **GDPR export** (#AUTH-62) — `GET /me/export`. Nút "Tải dữ liệu của tôi" trong `DangerZone` (tải file JSON client-side).
6. **Admin merge** (#AUTH-47) — `POST /admin/accounts/{id}/merge`. Dialog "Gộp tài khoản" trong `AccountsPage`/`AccountDetailDrawer`.
7. **Infra** — `X-Device-Id` (UUID stable lưu localStorage) attach vào axios cho các call trusted-devices → bật highlight `isCurrentDevice`.

**Ngoài scope:**
- `POST /api/auth/introspect`, `PUT /api/accounts/{id}`, `POST /api/auth/revoke` (đã loại trừ trong issue).
- BE đã có sẵn (chỉ consume); không đụng backend.
- Không refactor flow 2FA single-device (`/2fa/init` + `/2fa/confirm`) đã có — chỉ thêm option cross-device.
- Device A **không polling** — refresh tay (đã chốt; lưu ý BE comment có nhắc poll/SignalR nhưng scope này dùng manual refresh).

> **Delivery (đã chốt lại):** **1 PR lớn** cho cả 5 nhóm — chấp nhận trade-off với nguyên tắc Surgical/Simplicity & DoD (1 reviewer). PR ~25+ file mới; reviewer cần review theo từng nhóm trong checklist.

## Endpoints
| # | Method | Path | Auth | Request | Response `data` |
|---|--------|------|------|---------|-----------------|
| 1 | GET | `/api/accounts/me/trusted-devices` | ✅ + `X-Device-Id` | — | `TrustedDeviceDto[]` |
| 2 | DELETE | `/api/accounts/me/trusted-devices/{id}` | ✅ | — | `string (Guid)` (idempotent 200) |
| 3 | DELETE | `/api/accounts/me/trusted-devices` | ✅ | — | `null` (count trong `message`) |
| 4 | POST | `/api/auth/login/2fa/sms` | ❌ + header `X-Challenge-Token` | `{ challengeToken }` | `string` (phone masked `******1234`) |
| 5 | POST | `/api/auth/2fa/cross-device-confirm/request` | ✅ | — (body rỗng) | `{ confirmToken, expiresInSeconds, otpAuthUri, secret }` |
| 6 | POST | `/api/auth/2fa/cross-device-confirm` | ✅ | `{ confirmToken, totpCode }` | `string (Guid)` accountId |
| 7 | POST | `/api/auth/reactivate-request` | ❌ | `{ email }` | `string` (email normalized) |
| 8 | POST | `/api/auth/reactivate-verify` | ❌ | `{ email, otp }` | `string (Guid)` accountId |
| 9 | GET | `/api/accounts/me/export` | ✅ | — | `AccountDataExportDto` (tải JSON) |
| 10 | POST | `/api/admin/accounts/{id}/merge` | ✅ Admin | `{ secondaryAccountId, reason }` | `string (Guid)` primaryId |

> Lưu ý #4: SMS fallback gửi xong → user vẫn submit về `POST /auth/login/verify-2fa` với `{ challengeToken, code, isBackupCode:false, isSmsCode:true }` (bắt buộc `isSmsCode=true`). → cần thêm field `isSmsCode` vào `Verify2faLoginPayload` hiện có.

## Enums
| Enum | File nguồn | Ghi chú |
|------|-----------|---------|
| (không thêm enum mới) | — | TrustedDevice/merge dùng plain DTO. `AvatarSourceEnum`/`AccountStatusEnum` cho export reuse từ `shared/enums/account.enum.ts` nếu cần render |

## Types
| File | Action | Types |
|------|--------|-------|
| `src/features/auth/types/trusted-device.types.ts` | create | `TrustedDeviceDto` (id, label, ipPrefix, userAgentSnapshot?, trustedAt, expiresAt, lastUsedAt?, usageCount, isCurrentDevice) — khớp BE `TrustedDeviceDto.cs` |
| `src/features/auth/types/account.types.ts` | modify | `CrossDeviceRequestResponseData` (confirmToken, expiresInSeconds, otpAuthUri, secret); `CrossDeviceConfirmPayload` (confirmToken, totpCode); `AccountDataExportDto` (account, profile?, staffProfile?, sessions[], auditLogs[], backupCodes[], exportedAt, format, version) — **staffProfile** = `{ employeeCode?, department?, skillTier?, notes? }` (theo BE `StaffProfileSnapshot`, khác doc) |
| `src/features/auth/types/auth.types.ts` | modify | `ReactivateRequestPayload` (email); `ReactivateVerifyPayload` (email, otp); `Sms2faPayload` (challengeToken). **Mở rộng `Verify2faLoginPayload`** thêm `isSmsCode?: boolean`, `trustDevice?: boolean`, `trustDeviceLabel?: string` — khớp BE `Verify2FALoginCommand` (đã verify có đủ 3 field) |
| `src/features/admin/types/admin.types.ts` | modify | `MergeAccountPayload` (secondaryAccountId, reason) — ⚠️ file đúng là `admin.types.ts`, KHÔNG phải `account.types.ts` |

## Schema (Zod)
| File | Action | Field |
|------|--------|-------|
| `src/features/auth/schemas/reactivate.schema.ts` | create | request: `email: z.string().email()` · verify: `email`, `otp: z.string().length(6)` |
| `src/features/auth/schemas/cross-device-confirm.schema.ts` | create | `confirmToken: z.string().length(64)`, `totpCode: z.string().length(6).regex(/^\d{6}$/)` |
| `src/features/admin/schemas/merge-account.schema.ts` | create | `secondaryAccountId: z.string().uuid()`, `reason: z.string().min(1).max(1000)` |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | Thêm `AUTH.LOGIN_2FA_SMS`, `AUTH.TWO_FA_CROSS_DEVICE_REQUEST`, `AUTH.TWO_FA_CROSS_DEVICE_CONFIRM`, `AUTH.REACTIVATE_REQUEST`, `AUTH.REACTIVATE_VERIFY`; `ACCOUNTS.ME.TRUSTED_DEVICES` (+ `TRUSTED_DEVICE(id)`), `ACCOUNTS.ME.EXPORT`; `ADMIN.ACCOUNTS.MERGE(id)` |
| `src/shared/utils/queryKeys.ts` | modify | `KEY.trustedDevices` + `QUERY_KEY.trustedDevices.list()` |
| `src/shared/lib/deviceId.ts` | create | `getDeviceId()` — đọc/ghi UUID localStorage key `device_id` (crypto.randomUUID) |
| `src/shared/lib/axios.ts` | modify | **Request** interceptor (block hiện attach Bearer) thêm `config.headers["X-Device-Id"] = getDeviceId()`. Là device id, KHÔNG phải token → không vi phạm rule token-cookie-only |
| **Trusted Devices** | | |
| `src/features/auth/services/trusted-device.service.ts` | create | list / revokeOne(id) / revokeAll |
| `src/features/auth/hooks/useTrustedDevices.ts` | create | `useQuery` (staleTime ~1 phút) |
| `src/features/auth/hooks/useRevokeTrustedDevice.ts` | create | `useMutation` → invalidate `KEY.trustedDevices` |
| `src/features/auth/hooks/useRevokeAllTrustedDevices.ts` | create | `useMutation` → invalidate |
| `src/features/auth/components/TrustedDevicesSection.tsx` | create | List + badge "Thiết bị này" + nút revoke / revoke-all (confirm dialog) |
| **2FA SMS fallback** | | |
| `src/features/auth/services/auth.service.ts` | modify | `sendSms2fa(challengeToken)` — set header `X-Challenge-Token` |
| `src/features/auth/hooks/useSend2faSms.ts` | create | `useMutation` → trả phone masked |
| `src/features/auth/pages/Login2faPage.tsx` | modify | Nút "Gửi OTP qua SMS" (set `isSmsCode:true` khi verify) + **checkbox "Tin tưởng thiết bị này" + input label** (set `trustDevice`/`trustDeviceLabel`) |
| `src/features/auth/hooks/useVerify2faLogin.ts` | modify | Hỗ trợ `isSmsCode` + `trustDevice` + `trustDeviceLabel` |
| `src/features/auth/components/LoginForm.tsx` | modify | (Reactivate) thêm `<Link to="/reactivate">` cạnh link quên mật khẩu — **không** sửa `LoginPage.tsx` (chỉ render `<LoginForm/>`) |
| **Cross-device 2FA** | | |
| `src/features/auth/services/account.service.ts` | modify | `requestCrossDevice2fa()`, `confirmCrossDevice2fa(payload)` |
| `src/features/auth/hooks/useRequestCrossDevice2fa.ts` | create | `useMutation` (Device A) |
| `src/features/auth/hooks/useConfirmCrossDevice2fa.ts` | create | `useMutation` (Device B) |
| `src/features/auth/components/TwoFactorSetup.tsx` | modify | Tab/option "Thiết bị này không có camera? Gửi qua thiết bị khác" → render QR + countdown TTL 10' + nút "Tôi đã xác nhận xong / Refresh" (refetch `/me`) |
| `src/features/auth/pages/CrossDeviceConfirmPage.tsx` | create | Route `/2fa/cross-device-confirm?token=` (Device B): parse token, nhập TOTP, confirm; success → prompt regenerate backup codes |
| `src/router/index.tsx` | modify | Thêm route `/2fa/cross-device-confirm` (authenticated) |
| **Reactivate** | | |
| `src/features/auth/services/auth.service.ts` | modify | `reactivateRequest(email)`, `reactivateVerify(payload)` |
| `src/features/auth/hooks/useReactivateRequest.ts` | create | `useMutation` |
| `src/features/auth/hooks/useReactivateVerify.ts` | create | `useMutation` |
| `src/features/auth/pages/ReactivatePage.tsx` | create | 2 bước (email → OTP), success → toast + `navigate('/login')` |
| `src/router/index.tsx` | modify | Thêm route public `/reactivate` (AuthLayout) |
| **GDPR export** | | |
| `src/features/auth/services/account.service.ts` | modify | `exportMyData()` → `axiosInstance.get<CommonResponse<AccountDataExportDto>>(...)` (trả full AxiosResponse) |
| `src/features/auth/hooks/useExportMyData.ts` | create | `useMutation`: đọc `res.data.data` (axios **không** unwrap) → `JSON.stringify` → `Blob` → download `account-export-{id}-{yyyymmdd}.json` |
| `src/features/auth/components/DangerZone.tsx` | modify | Nút "Tải dữ liệu của tôi (GDPR)" |
| **Admin merge** | | |
| `src/features/admin/schemas/merge-account.schema.ts` | create | Zod schema (xem mục Schema) |
| `src/features/admin/services/admin-accounts.service.ts` | modify | `merge(primaryId, payload)` → `POST /api/admin/accounts/{id}/merge` |
| `src/features/admin/hooks/useMergeAccount.ts` | create | `useMutation` → invalidate `KEY.admin.accounts` |
| `src/features/admin/components/MergeAccountDialog.tsx` | create | Form RHF+Zod: **secondary account = combobox chọn từ danh sách** (reuse `useAdminAccounts`, loại trừ primary + đã merged) + `reason` textarea; `setError` map lỗi; cảnh báo tombstone không hoàn tác. Chỉ render khi `checkRole(user,'ADMIN')` |
| `src/features/admin/pages/AccountsPage.tsx` hoặc `AccountDetailDrawer.tsx` | modify | Nút "Gộp tài khoản" mở dialog (Admin only — `checkRole(user,'ADMIN')`) |

## Approach
- **Layering chuẩn FE:** component → hook (TanStack Query) → service → axios. Không gọi API trong component.
- **X-Device-Id:** `getDeviceId()` đọc/tạo UUID trong localStorage (chỉ device id, **không** phải token — không vi phạm rule cookie-only token). Attach ở request interceptor cho mọi request (BE chỉ đọc với trusted-devices).
- **SMS 2FA:** hook `useSend2faSms` set header `X-Challenge-Token` qua axios config per-request. Sau khi user nhập OTP SMS → `verify-2fa` với `isSmsCode:true`.
- **Trust device:** ở `Login2faPage`, checkbox "Tin tưởng thiết bị này" + input label → truyền `trustDevice`/`trustDeviceLabel` vào `verify-2fa`. Đây là nguồn dữ liệu cho Trusted Devices list.
- **Cross-device:** Device A dùng `useRequestCrossDevice2fa` → render QR (`otpAuthUri`) + secret + countdown từ `expiresInSeconds`. **Refresh tay**: nút bấm → `queryClient.invalidateQueries(currentUser/profile)` để load lại trạng thái `twoFactorEnabled`. Device B page confirm → success → modal prompt gọi regenerate backup codes (vì cross-device không sinh backup codes).
- **GDPR export:** axios interceptor **KHÔNG** unwrap (`axios.ts:132 (response)=>response`). Hook đọc `res.data.data` (= `AccountDataExportDto`) → `JSON.stringify(data, null, 2)` → `Blob({type:'application/json'})` → `URL.createObjectURL` → anchor download (filename theo BE: `account-export-{accountId:N}-{yyyymmdd}.json`). BE có set Content-Disposition nhưng body là JSON nên không auto-download → tự build Blob.
- **Reactivate:** page public 2 bước trong AuthLayout; verify thành công không cấp token → redirect `/login`.
- **Admin merge:** form-based → `handleErrorApi({ error, setError })`; map 404/409 (primary/secondary not found / đã merge) ra toast; cảnh báo hành động không hoàn tác.

## Edge Cases
- **Trusted Devices:** list rỗng → EmptyState; revoke idempotent (200 dù đã revoke) → vẫn toast success + refetch; `isCurrentDevice` chỉ đúng khi đã gửi `X-Device-Id`.
- **SMS 2FA:** `409` account chưa verify phone → toast "Hãy dùng Authenticator hoặc backup code"; `422` challenge expired → quay lại `/login`; `429` rate limit → disable nút + countdown.
- **Cross-device:** `409` 2FA đã bật → đóng flow, refetch; `403` anti-stolen-link (token không thuộc account) → toast + về settings; `404` token hết hạn → yêu cầu request lại từ Device A; `422` TOTP sai → cho retry (token chưa xoá).
- **Reactivate:** request luôn 200 (anti-enumeration) → message trung lập "Nếu tài khoản trong window 90 ngày, OTP đã gửi"; verify `401` OTP sai/hết hạn → lỗi dưới input; `404` ngoài window → toast.
- **GDPR export:** lỗi mạng → toast; file lớn → vẫn build Blob (data đã ở client).
- **Admin merge:** `400` validation (trùng primary/secondary, reason rỗng/>1000) → setError; `409` đã merge → toast; chặn UI khi không phải Admin.

## Acceptance Criteria
- [ ] Trusted Devices: list hiển thị đúng (label, ipPrefix, trustedAt, expiresAt, lastUsedAt, usageCount), highlight "thiết bị này", revoke 1 + revoke all hoạt động và refetch.
- [ ] `X-Device-Id` được attach vào request và persist qua reload (cùng UUID).
- [ ] Login2fa: nút gửi SMS hoạt động, hiển thị phone masked, verify với `isSmsCode:true` đăng nhập thành công.
- [ ] Login2fa: checkbox "Tin tưởng thiết bị này" + label → device xuất hiện trong Trusted Devices list sau khi login.
- [ ] Admin merge: secondary chọn qua **combobox** (không gõ UUID tay), loại trừ primary/đã-merged.
- [ ] Cross-device: Device A render QR + countdown; Device B (page `/2fa/cross-device-confirm`) confirm bật 2FA; Device A refresh tay thấy trạng thái cập nhật; prompt regenerate backup codes.
- [ ] Reactivate: page 2 bước, request anti-enumeration message, verify thành công → redirect `/login`.
- [ ] GDPR export: bấm nút tải về file JSON đúng tên `account-export-{id}-{yyyymmdd}.json`.
- [ ] Admin merge: dialog chỉ hiện cho Admin, submit merge thành công refetch danh sách; lỗi 409/404 hiển thị đúng.
- [ ] `npx tsc --noEmit` + `npx eslint . --max-warnings=0` + `npm run build` → PASS.

## Steps
- [x] Bước 1 — Types + Schemas: tạo `trusted-device.types.ts`, mở rộng `account.types.ts`/`auth.types.ts`/`admin/types/admin.types.ts`; schemas reactivate/cross-device/merge. — 2026-06-20
- [x] Bước 2 — Endpoints + queryKeys + deviceId infra + axios `X-Device-Id`.
- [x] Bước 3 — Services: trusted-device, auth (sms/reactivate), account (cross-device/export), admin-accounts (merge).
- [x] Bước 4 — Hooks: trusted-devices (list/revoke/revokeAll), send2faSms, cross-device (request/confirm), reactivate (request/verify), exportMyData, mergeAccount. — 2026-06-20
- [x] Bước 5 — Components + Pages: TrustedDevicesSection, TwoFactorSetup (cross-device), CrossDeviceConfirmPage, ReactivatePage, DangerZone (export), MergeAccountDialog; wire AccountSettingsPage / Login2faPage / LoginForm / AccountsPage. — 2026-06-20
- [x] Bước 6 — Router: route `/2fa/cross-device-confirm` (auth) + `/reactivate` (public). — 2026-06-20
- [x] Bước 7 — Quality gate: `tsc --noEmit` ✓ + `eslint --max-warnings=0` ✓ + `npm run build` ✓ PASS. — 2026-06-20

## Câu hỏi đã giải đáp
1. **Delivery/sequencing** → **1 PR lớn** duy nhất cho cả 5 nhóm (chấp nhận trade-off với Surgical/Simplicity & DoD 1-reviewer).
2. **X-Device-Id infra** → **Thêm** device-id (UUID localStorage) + attach ở request interceptor để bật `isCurrentDevice`.
3. **Cross-device Device A** → **Refresh tay** (countdown + nút refetch), không polling.
4. **Sprint** → chuyển #88 từ Sprint 1 (quá hạn) → **Sprint 3** (current, due 2026-06-27). Đã `gh issue edit`.
5. **Admin merge UX** → secondary account chọn qua **combobox** từ danh sách, không gõ UUID tay.
6. **GDPR export** → tải file qua Blob client-side, đọc `res.data.data` (axios **không** unwrap CommonResponse).
7. **Reactivate entry** → link ở **`LoginForm.tsx`** (không phải `LoginPage`) → page `/reactivate` 2 bước → redirect `/login`.

## Corrections sau khi đọc BE source (review vòng 2)
- ❌→✅ axios **không** unwrap `CommonResponse` → GDPR đọc `res.data.data`.
- ❌→✅ Admin merge payload type đặt ở `admin.types.ts` (không phải `account.types.ts` không tồn tại).
- ❌→✅ Link reactivate đặt ở `LoginForm.tsx` (LoginPage chỉ render LoginForm).
- ➕ BE `Verify2FALoginCommand` có `IsSmsCode` **+ `TrustDevice` + `TrustDeviceLabel`** → thêm checkbox trust device ở Login2fa (nguồn data cho Trusted Devices).
- ➕ `StaffProfileSnapshot` (export) = `{ employeeCode, department, skillTier, notes }` theo BE thật (khác doc).
- ✅ Tất cả route/payload còn lại đã đối chiếu BE C# command thật và khớp.
