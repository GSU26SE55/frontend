# Frontend Review — Cấu trúc, Dead Code, Type/Schema/DTO

> **Ngày:** 2026-07-19 · **Phạm vi:** `frontend/src` (624 file TS/TSX)
> **Phương pháp:** `knip` (reachability toàn repo) + 6 agent khảo sát song song + verify thủ công bằng grep từng symbol / diff shape / shasum.
> **Trạng thái:** Tất cả phát hiện dưới đây **đã kiểm chứng bằng bằng chứng cứng** (đã rà 2 lượt). Đây là báo cáo — **chưa sửa code**.
> Mọi thay đổi phải theo workflow dự án: `/kltn-plan` → approve `plan.md` → `/kltn-implement`.

---

## 0. Chẩn đoán tổng quát

| Chỉ số | Giá trị | Ý nghĩa |
|---|---|---|
| File type/schema | ~88 | — |
| `extends` trong `.types.ts` | 4 | Rất ít composition |
| `Pick<` | 1 · `Omit<` 4 | Gần như không tái sử dụng |
| Zod `.extend/.merge/.pick/.omit/.partial` | **1** (cả dự án) | Schema copy-paste diện rộng |
| File unused (knip, đã loại 2 file shadcn `ui/`) | **51** | Dead code tồn đọng |

**Phần lõi lành mạnh** (không cần đụng): 1 axios instance duy nhất · JWT decode tập trung · debounce đã centralize (`useDebounce`) · endpoints không hardcode `/api` · axios refresh-queue chống double-refresh đúng · route RBAC + boot 3-case đúng thiết kế · 0 TODO/FIXME.

---

## 1. Dead code — ✅ ĐÃ DỌN (2026-07-19): xóa 50 file, còn 2 file shadcn `ui/` giữ lại

> **Đã thực hiện.** Xóa **50 file** dead (49 file cluster + `App.css`). Verify: mỗi file chỉ được import trong nội bộ cluster hoặc 0-import (grep loại-trừ-cluster) → dead thật. Sau xóa: `tsc=0, eslint=0, build=0`. knip từ 51 → 2 unused files (2 file `components/ui/{progress,sheet}.tsx` là shadcn generated — **giữ lại**, không phải dead).
>
> Các cụm đã xóa: session management (4), admin chat/audit/sla/report (~20), file-hooks (3), anomaly-classification (4), staff assignment (3), manager schemas (2), component orphan (4: BatteryRealtimeCard, Sparkline, KbArticleCard, primitives), diffColors.ts, App.css.

### (Tham chiếu gốc) Dead code (51 file) — trước khi dọn

Không có barrel `index.ts`, không có dynamic `import()` → grep tĩnh đủ tin cậy. Mỗi mục dưới đã grep **từng symbol export thật** (không chỉ tên file) → 0 tham chiếu ngoài file khai báo.

### 1.1. Cluster feature xây dở / gỡ UI (hỏi team trước khi xoá)
| Cụm | File |
|---|---|
| **Session management** | `auth/services/session.service.ts` + `useSessions`, `useRevokeSession`, `useRevokeAllSessions` |
| **Admin chat/audit/sla/report** (~20 file) | `useMyChats`, `useSlaRules`, `useTicketReports` (9 export), `useTicketParticipants` (7 export), `useAdminAlerts`, `useChatTemplates`, `useChatMentions`, `useAuditAggregator` (9 export), `useAdminChatSearch`, `useAdminTicketAuditLogs`, `useLatestReading` + service + type tương ứng |
| **File storage hooks** | `shared/hooks/file/{useDeleteFile, useFileMetadata, usePresignedUrl}` |
| **Anomaly classification** | `shared/{services,types,enums}/anomaly-classification.*` + `useSubmitClassificationFeedback` |
| **Staff assignment** | `useStaffAssignmentProfile`, `useStaffList`, `staff.service.ts` |
| **Manager schemas** | `create-ticket.schema.ts`, `reopen-ticket.schema.ts` |

### 1.2. Xoá an toàn (dead thuần, không phải feature dở)
- Component orphan: `shared/components/kb/KbArticleCard.tsx`, `shared/components/dashboard/Sparkline.tsx`, `admin/components/BatteryRealtimeCard.tsx`, `landing/components/primitives.tsx`
- `shared/theme/diffColors.ts` (cả file — `diffVars`/`DiffTone` 0 ref)
- `src/App.css` (rác scaffold Vite)
- Export thừa: `toneVars`, `TICKET_PRIORITY_TONE`, `SLA_TIMER_TONE` (statusColors) · `LOAD_FAILED_DEFAULT`, `NO_DATA_DEFAULT` (emptyStates)
- `console.log` sót: `shared/hooks/useVoiceRecorder.ts:125`

> **Không phải dead:** `SLA_WARNING_PERCENT`/`SLA_CAUTION_PERCENT` (`shared/lib/sla.ts`) vẫn dùng **nội bộ** — chỉ nên **bỏ `export`**, không xoá.

---

## 2. Lệch cấu trúc / tài liệu

| Phát hiện | Bằng chứng | Đề xuất |
|---|---|---|
| **ESLint `no-restricted-imports` KHÔNG tồn tại** | `eslint.config.js` không có rule; feature isolation chỉ là văn bản trong `fe.md` | Thêm rule để enforce (đóng khoảng cách doc↔code) |
| **`cn()` ở `src/lib/utils.ts`** (không phải `shared/lib/utils.ts` như doc) | `@/lib/utils` = 59 import; `shared/lib/utils.ts` không tồn tại | Sửa `fe.md`, giữ code |
| **`src/lib` vs `src/shared/lib`** | `src/lib/` chỉ có `utils.ts` (cn) — mặc định shadcn; infra khác ở `shared/lib` | Chấp nhận, chỉ đồng bộ doc |
| **Thiếu `ErrorBoundary` root** | doc nhắc nhưng không tồn tại | Cân nhắc bọc `RouterProvider` |
| **Không code-split** | ~70 page import tĩnh vào 1 bundle | Cân nhắc `React.lazy` theo role |
| `useStaffNotifications.ts:7` hardcode queryKey | thay vì `QUERY_KEY.notifications.list()` | Dùng factory |
| `useLogout.ts` import `ENDPOINTS` trực tiếp trong hook | nên qua `authService` | Chuyển vào service |

### Component đặt sai layer (chỉ 1 feature dùng → nên về `features/`)
- `shared/components/device-tokens/` + `shared/components/notification-preferences/` → chỉ `auth/pages/AccountSettingsPage.tsx` dùng → `features/auth/components/`
- `shared/utils/overviewPanels.ts`, `sidebarLabels.ts` (data tĩnh) → `shared/constants/`
- `shared/components/environmental/incidentLabels.ts` (file `.ts` data thuần trong `components/`) → `shared/constants/`
- `admin/types/admin.enums.ts` (tên `.enums.ts` trong folder `types/`) → `admin/enums/`

---

## 3. Type / DTO — cơ hội tái sử dụng

**Nguyên nhân gốc:** nhiều comment tự ghi *"nhân bản tối thiểu vì feature không được import feature khác"* → giải pháp đúng là **nâng lên `shared/`**.

### 3.1. Trùng shape 100% → `shared/types` + import lại
| DTO | Lặp ở | Xử lý |
|---|---|---|
| **`BatteryAssetDto`** (18 field) | admin + manager + staff | → `shared` (⚠ xem cảnh báo dưới) |
| **`SensorReadingDto`** + `...HistoryParams` + `...HistoryResponseDto` | admin + manager + staff | → `shared`; manager/staff `Pick` 4 field cursor |
| **`SessionDto`** (11 field) | admin + auth | → `shared/types/session.types` |
| **`NotificationDto`** (13 field) | staff (shared **đã có**) | Xoá bản staff, import shared |
| **`CommentAttachmentInput`** (4 field) | staff (shared đã có) + tự nhân bản `MaintenanceAttachmentInput` | Tạo base `AttachmentInput` ở shared |
| **`PermissionDto`**, **`LoginAttemptDto`** | admin + auth | Hợp nhất shared (chọn `\| null` theo BE) |
| `StaffNotificationsParams` ≡ `NotificationsParams` | staff vs shared | Dùng lại bản shared |

> ⚠️ **Rủi ro tên đụng:** có **2 `BatteryAssetDto` khác shape** — bản shared 10-field (dùng bởi `admin/manager site.service.ts`) và bản 18-field (3 feature). Khi hợp nhất **phải đổi tên** (vd `BatteryAssetDetailDto` cho bản 18-field).

### 3.2. Viết tay thay vì generic/Pick có sẵn
| Chỗ | Nên là |
|---|---|
| `LoginHistoryResponseData` (auth) | `PaginationResponse<LoginAttemptDto>` (khớp 100% field) |
| `CreateGatewayDevicePayload` / `...ResponseDto` (admin) | `Pick<GatewayDeviceDto, ...>` |
| `UpdateStaffProfilePayload` (admin) | `Pick<StaffProfileDto, ...>` |
| `GetLoginHistoryParams` (admin) | `Omit<LoginHistoryParams, "sortBy"\|"sortDir">` |
| `SessionSnapshot` (auth) | `Omit<SessionDto, "isCurrent">` (nới `status`) |

### 3.3. ✅ Đã làm đúng (không đụng)
`TicketDetailDTO extends TicketDTO` · `IotDeviceDetailDto/CreatedDto extends IotDeviceDto` · `UpdateKbArticlePayload extends CreateKbArticlePayload` · `UpdateBatteryAssetPayload extends CreateBatteryAssetPayload` · `AccountDto/StaffProfileDto/TicketDTO` chỉ định nghĩa 1 lần ở shared.

---

## 4. Zod Schema — cơ hội composition

### 4.1. P1 — trùng cả bộ giữa feature
- **`kbArticleSchema`** — **byte-identical 3 file** admin/manager/staff (cùng shasum `615be5a0…`) → `shared/schemas/kb-article.schema.ts`, re-export.
- **`addCommentSchema` + `commentAttachmentSchema`** — trùng 3 feature (admin `z.number()` lệch nhẹ vs manager/staff `z.number().int()`) → `shared/schemas/ticket-comment.schema.ts`.

### 4.2. P1 — field rule copy-paste → `shared/schemas/common.schema.ts`
| Field | Số nơi lặp | Ghi chú |
|---|---|---|
| Password regex | 5 | `change-password` đã lệch tay → cần thống nhất |
| Email | 8 | — |
| Phone VN regex | 3 | — |
| `fullName` (min 2) | 5 | — |
| OTP 6 số | 5 | 2 message khác nhau → thống nhất |
| `coord` helper | 2 | duplicate nguyên hàm (`site` + `battery-asset`) |

→ Tách `emailField`, `passwordField`, `phoneField`/`optionalPhoneField`, `fullNameField`, `otpField`, `coord`.

### 4.3. P2 — Create/Update viết lại thay vì `.pick/.omit/.extend/.partial`
- `createRole` == `editRole` (giống hệt) → gán thẳng.
- `createAccount`/`editAccount`, `createIotDevice`/`updateIotDevice`, `maintenanceLog`/`maintenanceLogUpdate` → dùng `.pick/.omit/.extend`.
- ⚠ `battery-type.schema.ts` — chỗ `.extend` **duy nhất** của dự án — thực chất **gần như no-op** (override field giống hệt); xem lại ý đồ.

---

## 5. Trùng lặp logic (không chỉ type)

| Trùng | Vị trí | Đề xuất |
|---|---|---|
| **Format ngày** | `toLocaleDate*` ở 25 file + `date-fns format(` ở 29 file, **không có `shared/utils/date.ts`** | Tạo util format ngày tập trung — trùng lan rộng nhất |
| **`formatDuration` HH:MM:SS** | 4 bản (manager/staff `SlaCountdown`, `ProcessingDurationTimer`, `VoiceMessagePlayer`) | Gom 1 util |
| **`SlaCountdown`** | manager vs staff gần trùng logic đếm ngược | Tách hook/component chung |
| **File lớn >400 dòng** | 15 file; nặng nhất `manager/staff TicketDetailPage.tsx` (750/733), `TicketKbReferencesPanel` (492/474) gần trùng | Tách component/hook chung |

---

## 6. Thứ tự làm đề xuất (rẻ→đắt, rủi ro thấp→cao)

1. **Rẻ nhất**: xoá bản local đã có sẵn ở shared — `NotificationDto`, `CommentAttachmentInput` (staff) → import shared.
2. `shared/schemas/common.schema.ts` (email/password/phone/otp/fullName/coord) + đổi 5 schema password sang dùng chung.
3. `kbArticleSchema` + `addCommentSchema` → `shared/schemas/`.
4. Dời file lệch layer (§2) + `admin.enums.ts` — cơ học, an toàn.
5. Hợp nhất `BatteryAssetDto` / `SensorReadingDto` (đổi tên tránh đụng) — impact cao nhất, đụng nhiều file.
6. `Pick/Omit/PaginationResponse` cho các payload §3.2.
7. Thêm ESLint `no-restricted-imports` (chặn drift cross-feature tương lai).
8. Quyết định số phận 51 file dead (§1) — cần team.

---

## 7. Điều chỉnh sau verify lần cuối — trước khi implement (2026-07-19)

Rà lại codebase thực tế 1 lần nữa ngay trước khi code. Các claim chính vẫn đúng, nhưng **cách thực thi bước 1 khác plan gốc** ở 3 điểm — ghi rõ để implement đúng:

1. **`CommentAttachmentInput` + `MaintenanceAttachmentInput` (staff) là DEAD CODE, không phải "đổi import".**
   Verify: **0 usage thực** trong toàn `features/staff` (khớp knip báo unused).
   → Hành động: **xoá hẳn 2 interface** trong `staff/types/staff-ticket.types.ts` (dòng ~38, ~51). KHÔNG cần import shared thay thế.

2. **`NotificationDto` (staff): xoá interface local nhưng GIỮ file.**
   `staff/types/notification.types.ts` còn `StaffNotificationsParams` (dùng bởi `useStaffNotifications.ts`) + re-export 3 enum. Diff với shared = **identical**.
   → Hành động: xoá riêng `interface NotificationDto` (dòng ~20) → thêm `export type { NotificationDto } from "@/shared/types/notification.types"`.
   → `AlertsPage.tsx` giữ nguyên import path cũ (nhờ re-export) ⇒ **0 file phải sửa import**.

3. **Gộp luôn `StaffNotificationsParams` ≡ `NotificationsParams` (shared).**
   Cùng shape 6 field. → Có thể re-export `NotificationsParams` từ shared làm nguồn, tránh đụng lại lần sau. (Tuỳ chọn — nếu muốn giữ scope tối thiểu thì để nguyên `StaffNotificationsParams`.)

4. **`kbArticleSchema`**: shasum đổi (`615be5a0…` → `c2c32d71…`) = file có chỉnh gần đây, nhưng **3 bản vẫn identical với nhau** ⇒ kết luận "kéo lên shared" vẫn đúng.

**Kế hoạch code bước 1 (chốt):**
| File | Action | Ghi chú |
|---|---|---|
| `features/staff/types/staff-ticket.types.ts` | modify | Xoá `CommentAttachmentInput` + `MaintenanceAttachmentInput` (dead) |
| `features/staff/types/notification.types.ts` | modify | Xoá `interface NotificationDto` local → re-export từ shared; (tuỳ chọn) gộp `StaffNotificationsParams` |
| — | verify | `npx tsc --noEmit` phải sạch sau khi sửa |

> **Git:** làm trên branch refactor (theo chỉ đạo user), không cần issue riêng cho bước dọn dẹp này.

---

## 8. Kết quả implement (2026-07-19) — tsc=0, eslint=0, build=0 ✓

Đã thực hiện bước 1–6 (trừ BatteryAssetDto hoãn). Verify cuối: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` đều PASS.

| Bước | Đã làm | File |
|---|---|---|
| 1 | Dọn DTO trùng staff: `NotificationDto`/`StaffNotificationsParams`/`CommentAttachmentInput`/`MaintenanceAttachmentInput` → re-export/alias shared | 2 file |
| 2 | Tạo `shared/schemas/common.schema.ts` (email/password/phone/otp/fullName/coord); refactor 11 schema (auth 8 + admin 3). `change-password` + `cross-device-confirm` GIỮ nguyên (biến thể có chủ đích) | 12 file |
| 3 | `kbArticleSchema` → `shared/schemas/kb-article.schema.ts`; `addCommentSchema`+`attachmentSchema` → `shared/schemas/ticket-comment.schema.ts`; 6 file feature re-export | 8 file |
| 4 | Dời `overviewPanels`/`sidebarLabels`/`incidentLabels` → `shared/constants/`; `device-tokens`/`notification-preferences` → `features/auth/components/`; **xóa `admin.enums.ts`** (dead duplicate — bản `AuditActionEnum` cũ, thiếu 6 giá trị 2FA) | ~15 file |
| 5 | Hợp nhất `SensorReadingDto`(3)/`SessionDto`(2)/`PermissionDto`(2)/`LoginAttemptDto`(2) → shared; **nâng `LoginAttemptResult` → `shared/enums/audit.enum.ts`** ⇒ **auth hết import chéo admin** | ~12 file |
| 6 | `LoginHistoryResponseData` = `PaginationResponse<LoginAttemptDto>`; `CreateGatewayDeviceResponseDto`/`CreateGatewayDevicePayload`/`UpdateStaffProfilePayload` → `Pick<>` | 3 file |

**Điều chỉnh phát sinh khi code (verify cứu lỗi):**
1. `CommentAttachmentInput`/`MaintenanceAttachmentInput` **không dead hoàn toàn** — dùng nội bộ (knip chỉ báo "unused export"). → re-export/alias thay vì xóa.
2. `admin.enums.ts` là **dead duplicate bản cũ**, không dời — **xóa hẳn** (bản `enums/` mới hơn, có 6 giá trị 2FA GH-295).
3. `BatteryAssetDto` **HOÃN** — rủi ro cao: 3 bản feature không identical (admin superset kèm `BatteryAssetRealtimeDto`), enum re-export theo feature riêng, **xung đột tên với bản shared 10-field** đang dùng bởi site.service. Cần xử lý riêng, cân nhắc đổi tên `BatteryAssetDetailDto`.
4. **`tsc -b` (build) bắt 2 lỗi mà `tsc --noEmit` bỏ qua**: re-export type/const qua barrel mất binding/kiểu literal → phải `import type` riêng + import `LoginAttemptResult` trực tiếp từ nguồn thật trong `LoginHistoryTable`. Bài học: verify phải chạy `npm run build`, không chỉ `--noEmit`.

**Đã hoàn tất (2026-07-19):**
- ✅ **BatteryAssetDto**: hợp nhất 3 bản feature 18-field → `shared/types/battery/battery-asset.types.ts` `BatteryAssetDetailDto` (đổi tên tránh đụng bản 10-field); nâng `WarrantyStatusEnum` → `shared/enums/battery.enum.ts`; xóa 2 enum dead (manager/staff). 3 feature re-export `BatteryAssetDetailDto as BatteryAssetDto`.
- ✅ **change-password rule**: thêm `passwordFieldBounded` (PASSWORD_REGEX + max 100) vào common.schema; change-password dùng nó → 0 password regex hardcode trong auth schemas.
- ✅ **ESLint `no-restricted-imports`**: thêm vào `eslint.config.js` — chặn cross-feature import (admin/manager/staff/auth), message tiếng Việt. Đã test: chặn đúng import chéo, eslint hiện tại sạch (0 vi phạm).
- ✅ **Dead code §1**: đã xóa 50 file (xem §1).

**Còn lại (tùy chọn, ưu tiên thấp):**
- `GetLoginHistoryParams` = `Omit<LoginHistoryParams,...>`, `SessionSnapshot` = `Omit<SessionDto,...>` (SessionSnapshot thuộc dead cluster session đã xóa).

---

## Phụ lục — Đính chính so với bản nháp ban đầu (đã verify lại)
1. `SLA_WARNING_PERCENT`/`SLA_CAUTION_PERCENT` **không dead** — dùng nội bộ, chỉ bỏ `export`.
2. `LoginAttemptResult` không phải "auth import bậy" — là symbol **dùng chung admin+auth** đặt nhầm trong `admin/enums` → nâng lên `shared/enums/audit.enum.ts`.
3. Lý do "phải đặt ở shared" **không phải** vì ESLint đang chặn (rule chưa cấu hình) — mà theo nguyên tắc kiến trúc dự án.
