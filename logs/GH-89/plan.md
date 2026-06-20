# Plan — GH-89: Tích hợp NotificationService API (notifications + device tokens)

## Metadata
- **Status:** IN_PROGRESS | **Role:** FE | **Ngày:** 2026-06-20
- **Issue:** #89 — https://github.com/GSU26SE55/frontend/issues/89
- **Sprint:** Sprint 3 (due 2026-06-27)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Tích hợp 5 REST endpoint của NotificationService vào web app theo `docs/api-notification.md`: API client layer (endpoints + services + hooks + types/enums) + UI cơ bản. `GET /api/notifications` đã có sẵn (staff `AlertsPage`) — phần này chỉ cập nhật import enum, không đụng logic.

## Scope
**Trong scope:**
- `POST /api/notifications` (Admin) — service + hook + schema + form + page admin + route + sidebar link.
- `POST` / `DELETE` / `GET /api/device-tokens` — service + hooks + types + schema (đặt ở `shared/`) + UI section trong `AccountSettingsPage`.
- Promote notification enums `features/staff/enums` → `shared/enums` (vì admin + staff cùng dùng) + bổ sung `DevicePlatformEnum`, `NotificationFrequencyEnum`.
- Bổ sung `endpoints.ts` (NOTIFICATIONS.CREATE + DEVICE_TOKENS) và `queryKeys.ts` (deviceTokens).

**Ngoài scope:**
- KHÔNG refactor `GET /api/notifications` logic / `useStaffNotifications` / `AlertsPage` (chỉ sửa đường dẫn import enum nếu cần).
- KHÔNG implement web-push thật (service worker / FCM web SDK) — chỉ build API client + UI quản lý token. Việc đăng ký lấy token thật để issue sau.
- KHÔNG làm digest/`NotificationFrequencyEnum` UI (enum chỉ khai báo để đủ domain, không có endpoint).
- KHÔNG đụng RabbitMQ consumer (BE).

## Endpoints
| Method | Path | Request | Response | Auth |
|--------|------|---------|----------|------|
| GET | `/api/notifications` | query: pageNumber/pageSize/type/channel/status/unreadOnly | `CommonResponse<PaginationResponse<NotificationDto>>` | `[Authorize]` (đã có) |
| POST | `/api/notifications` | `CreateNotificationPayload` | `CommonResponse<string>` (id, 201) | Admin |
| POST | `/api/device-tokens` | `{ token, platform, deviceInfo? }` | `CommonResponse<string>` (id; 201/200/409) | `[Authorize]` |
| DELETE | `/api/device-tokens` | body `{ token }` | `CommonResponse<string>` (id; 200/404) | `[Authorize]` |
| GET | `/api/device-tokens` | — | `CommonResponse<DeviceTokenDto[]>` | `[Authorize]` |

## Enums
| Enum | File nguồn | Ghi chú |
|------|-----------|---------|
| NotificationTypeEnum | `shared/enums/notification.enum.ts` | **move** từ staff/enums |
| NotificationChannelEnum | `shared/enums/notification.enum.ts` | **move** từ staff/enums |
| NotificationStatusEnum | `shared/enums/notification.enum.ts` | **move** từ staff/enums |
| DevicePlatformEnum | `shared/enums/notification.enum.ts` | **mới** — Ios=1, Android=2, Web=3 |
| NotificationFrequencyEnum | `shared/enums/notification.enum.ts` | **mới** — Immediate=1, Daily=2 (chỉ khai báo) |

## Types
```ts
// shared/types/device-token.types.ts
interface DeviceTokenDto { id: string; platform: DevicePlatformEnum; deviceInfo?: string | null;
  isActive: boolean; lastUsedAt?: string | null; createdAt: string; }
interface RegisterDeviceTokenPayload { token: string; platform: DevicePlatformEnum; deviceInfo?: string; }
interface UnregisterDeviceTokenPayload { token: string; }

// features/admin/types/notification.types.ts
interface CreateNotificationPayload {
  userId: string; type: NotificationTypeEnum; channel: NotificationChannelEnum;
  title: string; body: string; payloadJson?: string | null;
  entityType?: string | null; entityId?: string | null; bypassQuietHours?: boolean;
}
```

## Schema (Zod)
```ts
// features/admin/schemas/notification.schema.ts (create form)
userId:  z.string().uuid()
type:    z.nativeEnum(NotificationTypeEnum)
channel: z.nativeEnum(NotificationChannelEnum)
title:   z.string().trim().min(1).max(200)
body:    z.string().trim().min(1).max(2000)
entityType: z.string().max(100).optional()
bypassQuietHours: z.boolean().optional()

// shared/schemas/device-token.schema.ts (register form)
token:    z.string().min(1).max(500)
platform: z.nativeEnum(DevicePlatformEnum)
deviceInfo: z.string().max(500).optional()
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/notification.enum.ts` | create | Move Type/Channel/Status + add DevicePlatform/Frequency |
| `src/features/staff/enums/notification.enum.ts` | delete | Đã move sang shared |
| `src/features/staff/types/notification.types.ts` | modify | Import/re-export enum từ `shared/enums` |
| `src/shared/utils/endpoints.ts` | modify | `NOTIFICATIONS.CREATE` + `DEVICE_TOKENS` group |
| `src/shared/utils/queryKeys.ts` | modify | `KEY.deviceTokens` + `QUERY_KEY.deviceTokens.list()` |
| `src/shared/types/device-token.types.ts` | create | DTO + payloads |
| `src/shared/schemas/device-token.schema.ts` | create | Zod register |
| `src/shared/services/device-token.service.ts` | create | register / unregister / getList |
| `src/shared/hooks/useDeviceTokens.ts` | create | query list + mutation register/unregister |
| `src/shared/components/device-tokens/DeviceTokensSection.tsx` | create | List + revoke + register UI |
| `src/features/auth/pages/AccountSettingsPage.tsx` | modify | Thêm menu "Thiết bị" → render section |
| `src/features/admin/types/notification.types.ts` | create | CreateNotificationPayload |
| `src/features/admin/schemas/notification.schema.ts` | create | Zod create |
| `src/features/admin/services/notification.service.ts` | create | create() |
| `src/features/admin/hooks/useCreateNotification.ts` | create | useMutation |
| `src/features/admin/components/CreateNotificationForm.tsx` | create | Form (RHF + Zod) |
| `src/features/admin/pages/NotificationAdminPage.tsx` | create | Page host form |
| `src/router/index.tsx` | modify | Route `/admin/notifications` |
| `src/shared/components/layout/AppLayout.tsx` | modify | Nav item admin section → Notifications (nav config nằm inline ở đây, KHÔNG phải Sidebar.tsx) |

## Approach
- **Enum promote:** chuyển 3 enum sang `shared/enums/notification.enum.ts`, thêm 2 enum mới → cả `features/admin` (create form) và `features/staff` (list) import từ shared. `staff/types/notification.types.ts` re-export từ shared để các file staff khác không phải đổi. *(Đây là theo convention "≥2 feature dùng → shared/enums" trong rules/tech/fe.md — KHÔNG có guard `no-restricted-imports` trong `eslint.config.js`, nên việc tách là quy ước thủ công, không có CI chặn.)*
- **Device-tokens ở `shared/`** (mọi role đã login dùng): service qua `shared/lib/axios`, DELETE truyền body qua `axiosInstance.delete(url, { data })`. Hook `useDeviceTokens` (query, staleTime 5'), `useRegisterDeviceToken`/`useUnregisterDeviceToken` (mutation) → `invalidateQueries(QUERY_KEY.deviceTokens.list())`.
- **UI device-token** = section trong `AccountSettingsPage` (menu mới "Thiết bị"): list thiết bị + nút thu hồi + nút đăng ký thiết bị hiện tại (platform=Web). Lỗi non-form qua `onError` → `handleErrorApi({ error })`.
- **Admin create** = page `/admin/notifications` + `CreateNotificationForm` (RHF + Zod). Submit `try/catch` + `handleErrorApi({ error, setError })` map lỗi field BE xuống input. Success → toast + reset form (không invalidate vì target user khác).
- **bypassQuietHours** chỉ là checkbox optional trong form admin; BE tự merge vào payloadJson.

## RBAC & UX (chốt sau review)
- **Gate route + nav `/admin/notifications`:** dùng **role ADMIN**, KHÔNG dùng P constant. Lý do: BE gate endpoint bằng `[Authorize(Roles="Admin")]` (role-based) → JWT `perm[]` không phát `notification.create`; nếu gate bằng `checkPermission(P.NOTIFICATION_CREATE)` speculative thì link sẽ luôn ẩn. Route nằm dưới `RoleRoute([ADMIN])` (đã có); nav item đặt trong section admin của `AppLayout.tsx` (section này chỉ render cho ADMIN) → đúng pattern "checkRole cho menu-level gate" của rules/tech/fe.md. **Không thêm `P.NOTIFICATION_CREATE`.**
- **`userId` input (CreateNotificationForm):** chủ ý là **admin tooling** — nhập/paste UUID thô, validate format bằng `z.string().uuid()` (chỉ chặn UUID sai cú pháp). BE KHÔNG kiểm tra user tồn tại (xác nhận trong `docs/api-notification.md`) → notification "mồ côi" nếu paste nhầm là **rủi ro được chấp nhận** trong scope này. **User-picker (autocomplete account) = ngoài scope** (issue sau nếu cần).
- **Map enum int→label:** repo **không có util chung**; theo pattern hiện hữu (`TicketStatusBadge.tsx`, `TicketListPage.tsx`) → khai báo **label map / option array inline** ngay trong component cần render: `CreateNotificationForm` (option cho `type`/`channel`/`status`), `DeviceTokensSection` (label cho `platform`). Không tạo file util mới → nằm trong Bước 5, không phình scope.

## Edge Cases
- **Register 409** (thiết bị đã active): axios coi >=400 là error → `onError` toast "Thiết bị đã được đăng ký" (không phá UI).
- **Unregister 404** (token không active): toast lỗi từ BE message.
- **400 thiếu claim UserId**: hiển thị toast message BE ("Không xác định được user.").
- **Enum serialize số nguyên**: select option value là int; map int → label qua bảng enum khi render list notification/device.
- **`AccountStatusEnum` không liên quan** ở đây; nhưng giữ nguyên tắc không treat enum int `0` falsy (enum notif bắt đầu từ 1 nên an toàn).
- **DELETE body**: đảm bảo gửi qua `{ data }` chứ không phải query.
- **`userId` mồ côi**: paste UUID không tồn tại → BE vẫn tạo notification (không ai nhận). Chấp nhận theo chủ ý admin-tooling; chỉ validate format UUID, không validate tồn tại.

## Acceptance Criteria
- [ ] 3 enum notification nằm ở `shared/enums`, staff & admin import từ `shared/enums` (không lặp định nghĩa, `tsc --noEmit` PASS); `DevicePlatformEnum`/`NotificationFrequencyEnum` có mặt.
- [ ] `endpoints.ts` có `NOTIFICATIONS.CREATE` + `DEVICE_TOKENS.{REGISTER,UNREGISTER,LIST}`; service không hardcode URL.
- [ ] Admin vào `/admin/notifications`, submit form tạo notification → 201 → toast success; validation BE map xuống field.
- [ ] User mở Account Settings → tab "Thiết bị": thấy list thiết bị (GET), đăng ký thiết bị hiện tại (POST), thu hồi (DELETE) — list refetch sau mutation.
- [ ] `GET /api/notifications` / `AlertsPage` vẫn chạy như cũ (không regression).
- [ ] `npx tsc --noEmit` + `npx eslint . --max-warnings=0` + `npm run build` PASS.

## Steps
- [ ] Bước 1 — Enums: tạo `shared/enums/notification.enum.ts`, xóa staff enum, sửa `staff/types/notification.types.ts` re-export.
- [ ] Bước 2 — Endpoints + queryKeys: thêm CREATE + DEVICE_TOKENS + deviceTokens keys.
- [ ] Bước 3 — Device-tokens data layer (shared): types → schema → service → hooks.
- [ ] Bước 4 — Admin create data layer: types → schema → service → hook.
- [ ] Bước 5 — UI: `DeviceTokensSection` (+ label platform inline) + wire vào `AccountSettingsPage`; `CreateNotificationForm` (option type/channel/status inline) + `NotificationAdminPage` + route + nav item admin trong `AppLayout.tsx` (role ADMIN gate).
- [ ] Bước 6 — `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.

## Câu hỏi đã giải đáp
- **Scope depth?** → Client layer + UI cơ bản (không full UI).
- **Đặt code admin/device-tokens ở đâu?** → POST notifications (Admin) ở `features/admin`; device-tokens (mọi role) ở `shared/`. GET notifications giữ ở `features/staff`.
- **Web có web-push thật chưa?** → Chưa; build API client + UI quản lý token, chưa wire FCM/service worker (issue sau).
- **Hệ quả enum:** admin + staff cùng dùng → promote notification enums lên `shared/enums` (convention "≥2 feature dùng → shared"). *Lưu ý: không có guard `no-restricted-imports` enforce — đây là quy ước thủ công.*

## Ghi nhận sau review (v2)
- ❌→✅ Sửa: bỏ claim "tránh vi phạm no-restricted-imports" (rule không enforce trong eslint config).
- ⚠️→✅ RBAC: gate route/nav bằng **role ADMIN**, không thêm P constant (BE role-based, không phát `notification.create`). Nav config sửa từ `Sidebar.tsx` → `AppLayout.tsx` (đúng nơi định nghĩa).
- ⚠️→✅ `userId`: chốt là admin-tooling raw UUID + `z.uuid()`; orphan risk chấp nhận; user-picker out of scope.
- ⚠️→✅ Enum label: dùng label map/option inline trong component (repo không có util chung).
