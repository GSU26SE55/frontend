# Plan — GH-160: Wire 9 endpoint còn thiếu — Notification (8) + Ticket (1)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-08-01
- **Issue:** #160 — https://github.com/GSU26SE55/frontend/issues/160
- **Sprint:** Sprint 6 (due 2026-08-08)

## Mục tiêu
Wire 9 endpoint BE đã có nhưng FE chưa gọi: ma trận preference theo nhóm × kênh (Sprint 6.3 NOTI3-04),
track "đã mở" notification (NOTI3-14), trang quản lý notification template cho Admin (NOTI3-12), và
đổi priority ticket kèm lý do cho Manager. Output: user chỉnh được thông báo theo nhóm, Admin xem/
preview/gửi thử/quay lui template, Manager re-prioritize ticket.

## Scope

**Trong scope:**
- `GET`/`PUT /api/notification-preferences/matrix` + `GET /api/notification-preferences/categories` → section mới trong AccountSettings
- `PATCH /api/notifications/{id}/opened` → gọi khi click notification có deep-link trong NotificationBell
- 4 endpoint `/api/admin/notification-templates` (list · preview · test-send · activate) → trang mới `/admin/notification-templates`
- `POST /api/admin/tickets/{id}/re-prioritize` → dialog trong manager TicketDetailPage
- Đồng bộ enum: `NotificationStatusEnum` (+`Delivered=5`, `Opened=6`), `NotificationTypeEnum` (19 → 32 giá trị), thêm `NotificationCategoryEnum` (1–6)

**Ngoài scope:**
- 3 endpoint đã gỡ khỏi issue vì thiếu tiền đề BE (chi tiết ở cuối issue #160): voice retry, SMS cancel, unsubscribe
- **KHÔNG sửa** `NotificationPreferencesSection.tsx` / `notification-preference.service.ts` / `notification-preference.types.ts` — file của #97, tránh conflict. Code matrix đi vào file mới.
- Không tạo/sửa nội dung template (BE chưa có endpoint create/update — giới hạn có chủ đích của Sprint 6.3)
- Không tự tính SLA deadline mới sau re-prioritize (BE tính, FE refetch)

## Enums
| Enum | File nguồn | Action |
|------|-----------|--------|
| `NotificationStatusEnum` | `shared/enums/notification/notification.enum.ts` | modify — thêm `Delivered: 5`, `Opened: 6` |
| `NotificationTypeEnum` | `shared/enums/notification/notification.enum.ts` | modify — thêm `19–33` (ChatCreated…BatteryAnomalyInfo). ⚠️ BE range là **19→33** (không phải 31), có gap. **BỎ `TicketMerged`** vì BE khai value `= 27` **trùng** `ChatEscalatedToAdmin = 27` (bug BE, đã note) → thêm sẽ gây ambiguous khi map value→tên. Thêm đúng: `ChatCreated:19, ChatMentioned:20, ChatReacted:21, ParticipantAdded:22, ParticipantRemoved:23, ParticipantRoleChanged:24, BlogGenerationCompleted:25, BlogGenerationFailed:26, ChatEscalatedToAdmin:27, TicketApproved:28, TicketRejected:29, TicketReopened:30, TicketRatingRequested:31, BatteryAnomalyWarning:32, BatteryAnomalyInfo:33` (giữ `System:99` sẵn có) |
| ⚠️ **Nguồn số enum** | — | **Lấy theo `NotificationTypeEnum.cs` của BE, KHÔNG theo docs.** Bảng 32 type ở `docs/api-notification.md:152-183` **sai**: thiếu `BlogGenerationCompleted=25` / `BlogGenerationFailed=26` nên đánh số lệch 2 từ `ChatEscalatedToAdmin` trở đi (docs ghi 25, code là 27). Ai "sửa lại cho khớp docs" là làm hỏng mapping value→tên. Docs cần BE cập nhật riêng. |
| `NotificationCategoryEnum` | `shared/enums/notification/notification.enum.ts` | create — `Ticket:1, Sla:2, Battery:3, Environmental:4, Chat:5, Account:6` |
| `NotificationChannelEnum` | (đã có) | dùng lại cho filter template |
| `TicketPriorityEnum` | `shared/enums/ticket/ticket.enum.ts` | dùng lại (`P1Critical`/`P2High`/`P3Normal`) |

## Types
```ts
// shared/types/notification/notification-matrix.types.ts  (FILE MỚI — không đụng #97)
// ⚠️ KHÔNG tạo NotificationMatrixChannelsDto extends... — BE `NotificationPreferenceDto`
// ĐÃ chứa sẵn notifyOnChat/notifyOnMention/notifyOnReaction/digestWindowMinutes (verified
// NotificationPreferenceDto.cs:14-17). Dùng thẳng type NotificationPreferenceDto có sẵn từ #97.
interface NotificationCategoryPreferenceDto {
  category: NotificationCategoryEnum; categoryName: string;
  pushEnabled: boolean; emailEnabled: boolean; smsEnabled: boolean; inAppEnabled: boolean;
  isCustomized: boolean;                     // false = kế thừa từ channels
}
interface NotificationPreferenceMatrixDto {
  channels: NotificationPreferenceDto;               // type có sẵn của #97 (không extend)
  categories: NotificationCategoryPreferenceDto[];   // LUÔN đúng 6 phần tử, sort theo enum 1→6
}
interface UpdateNotificationMatrixPayload {
  items: { category: NotificationCategoryEnum; pushEnabled: boolean;
           emailEnabled: boolean; smsEnabled: boolean; inAppEnabled: boolean }[];
}
interface NotificationCategoryMapDto {       // GET /categories — render theo length BE trả về,
  type: string; typeValue: number; category: string; categoryValue: number;   // KHÔNG hardcode "32"
}
// ⚠️ NotificationCategoryMap BE KHÔNG map hết mọi type (BlogGeneration*, TicketMerged... không có).
// FE dùng data BE trả (group theo categoryValue) — không giả định số phần tử cố định.

// features/admin/types/notification/notification-template.types.ts  (FILE MỚI)
interface NotificationTemplateDto {
  id: string; type: string; channel: string; locale: string;   // type/channel là TÊN enum (string)
  version: number; isActive: boolean;
  titleTemplate: string; bodyTemplate: string;
  createdAt: string; updatedAt?: string | null;
}
interface NotificationTemplateListParams { type?: string; channel?: string; locale?: string }
interface TemplatePreviewPayload { sampleData?: Record<string, unknown> }
interface TemplatePreviewDto { type: string; channel: string; locale: string; version: number; title: string; body: string }
interface TemplateTestSendDto { remainingThisHour: number }

// features/manager/types — dùng lại TicketActionResponse có sẵn. TicketActionDTO.warnings có tồn tại
// nhưng handler re-prioritize KHÔNG set → phát hiện auto-escalate qua data.status === "Escalated", KHÔNG qua warnings.
interface ReprioritizePayload { priority: TicketPriorityEnum; reason: string }
```

## Schema (Zod)
```ts
// shared/schemas/notification/notification-matrix.schema.ts
categoryRow: { category: z.nativeEnum(NotificationCategoryEnum),
               pushEnabled/emailEnabled/smsEnabled/inAppEnabled: z.boolean() }
matrixForm:  { items: z.array(categoryRow).length(6) }     // form giữ đủ 6 dòng, submit chỉ dòng đổi

// features/admin/schemas/notification/notification-template.schema.ts
sampleDataJson: z.string().optional().refine(parse được JSON object)   // textarea nhập JSON
templateFilter: { type?: string; channel?: string; locale?: string }

// features/manager/schemas/ticket/ticket.schema.ts  (thêm vào file có sẵn)
reprioritizeSchema: { priority: z.nativeEnum(TicketPriorityEnum),
                      reason: z.string().trim().min(1, "Bắt buộc").max(1000) }
```

## Endpoints
| Method | Path | Request | Response |
|--------|------|---------|----------|
| PATCH | `/api/notifications/{id}/opened` | — | `CommonResponse<string>` (Guid). Idempotent → vẫn 200 |
| GET | `/api/notification-preferences/matrix` | — | `CommonResponse<NotificationPreferenceMatrixDto>` |
| PUT | `/api/notification-preferences/matrix` | `{ items: [...] }` | `CommonResponse<NotificationPreferenceMatrixDto>` (ma trận đầy đủ sau update) |
| GET | `/api/notification-preferences/categories` | — | `CommonResponse<NotificationCategoryMapDto[]>` (số phần tử theo BE `NotificationCategoryMap.All`, KHÔNG cố định 32) |
| GET | `/api/admin/notification-templates` | `?type=&channel=&locale=` | `CommonResponse<NotificationTemplateDto[]>` |
| POST | `/api/admin/notification-templates/{id}/preview` | `{ sampleData? }` | `CommonResponse<TemplatePreviewDto>` |
| POST | `/api/admin/notification-templates/{id}/test-send` | `{ sampleData? }` | `CommonResponse<{ remainingThisHour }>` |
| POST | `/api/admin/notification-templates/{id}/activate` | — | `CommonResponse<null>` |
| POST | `/api/admin/tickets/{id}/re-prioritize` | `{ priority, reason }` | `TicketActionResponse` |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/notification/notification.enum.ts` | modify | +Delivered/Opened, +13 type, +NotificationCategoryEnum |
| `src/shared/types/notification/notification-matrix.types.ts` | create | types matrix + category map |
| `src/shared/schemas/notification/notification-matrix.schema.ts` | create | zod form ma trận |
| `src/shared/services/notification/notification-matrix.service.ts` | create | getMatrix / updateMatrix / getCategories |
| `src/shared/hooks/notifications/useNotificationMatrix.ts` | create | 3 hook TanStack Query |
| `src/shared/services/notification/notification.service.ts` | modify | +`markOpened(id)` |
| `src/shared/hooks/notifications/useNotifications.ts` | modify | +`useMarkNotificationOpened` |
| `src/shared/components/layout/NotificationBell.tsx` | modify | click item có deep-link → `/opened` thay `/read` |
| `src/shared/utils/endpoints.ts` | modify | `NOTIFICATIONS.OPENED`, `NOTIFICATION_PREFERENCES.MATRIX/CATEGORIES`, `ADMIN.NOTIFICATION_TEMPLATES`, `ADMIN.TICKETS.RE_PRIORITIZE` |
| `src/shared/utils/queryKeys.ts` | modify | `notificationPreferences.matrix()/.categories()`, `admin.notificationTemplates.list()` |
| `src/features/auth/components/profile/NotificationCategoryMatrixSection.tsx` | create | bảng 6 nhóm × 4 kênh |
| `src/features/auth/pages/AccountSettingsPage.tsx` | modify | render section mới dưới `NotificationPreferencesSection` |
| `src/features/admin/types/notification/notification-template.types.ts` | create | — |
| `src/features/admin/schemas/notification/notification-template.schema.ts` | create | — |
| `src/features/admin/services/notification/notification-template.service.ts` | create | 4 method |
| `src/features/admin/hooks/notification/useNotificationTemplates.ts` | create | list + preview + testSend + activate |
| `src/features/admin/components/notification/NotificationTemplateTable.tsx` | create | bảng + filter + nút preview/test-send/activate |
| `src/features/admin/components/notification/NotificationTemplatePreviewDialog.tsx` | create | nhập sampleData JSON → preview → nút gửi thử |
| `src/features/admin/pages/NotificationTemplatesPage.tsx` | create | trang `/admin/notification-templates` |
| `src/features/admin/config/adminNav.ts` | modify | thêm mục sidebar |
| `src/router/index.tsx` | modify | route `notification-templates` trong nhánh admin |
| `src/features/manager/services/ticket/ticket.service.ts` | modify | +`reprioritize(id, payload)` |
| `src/features/manager/hooks/ticket/useManagerTickets.ts` | modify | +`useReprioritizeTicket(id)` |
| `src/features/manager/schemas/ticket/ticket.schema.ts` | modify | +`reprioritizeSchema` |
| `src/features/manager/components/ticket/ReprioritizeDialog.tsx` | create | theo pattern `EscalateDialog.tsx` |
| `src/features/manager/pages/TicketDetailPage.tsx` | modify | nút + wire dialog vào state `dialog` có sẵn |

## Approach

**Ma trận preference (nhóm × kênh):**
- Section mới, độc lập với `NotificationPreferencesSection` của #97. `GET /matrix` trả cả `channels`
  lẫn `categories` — section này **chỉ render `categories`** (6 dòng × 4 switch), phần `channels` để
  section cũ lo. Hiện badge "Kế thừa" khi `isCustomized = false`.
- PUT là **vá từng dòng**: submit chỉ gửi những `category` user đã đổi, nhưng **mỗi dòng phải đủ 4 kênh**
  (BE nhận thiếu field = `false`, không giữ giá trị cũ).
- Dòng bị công tắc kênh toàn cục tắt → disable + tooltip "Kênh X đang tắt ở phần trên" (BE: `channels` thắng mọi dòng nhóm).
- `GET /categories` dùng cho tooltip "tắt nhóm này thì mất thông báo nào" — group theo `categoryValue`.

**Opened:**
  Click item trong NotificationBell
  → có `entityId` + điều hướng được (hiện chỉ `entityType === "Ticket"`) → `markOpened(id)` rồi navigate
  → không deep-link → giữ nguyên `markRead(id)`
  → cả 2 nhánh chỉ gọi khi `status ∉ {Read, Opened}`

**Template admin:**
  `GET /templates` (filter type/channel/locale) → bảng, group hiển thị theo bộ ba (Type × Channel × Locale),
  badge "Đang dùng" cho `isActive`
  → nút Xem trước → dialog nhập sampleData JSON → `POST /preview` → hiện title/body đã render
  → nút Gửi thử (chỉ enable khi `channel === "Email"`) → `POST /test-send` → toast kèm `remainingThisHour`
  → nút Kích hoạt (chỉ hiện ở bản `isActive = false`) → `POST /activate` → invalidate list

**Re-prioritize:**
  Nút chỉ hiện với Manager, và chỉ khi `status ∈ {Open, Assigned, InProgress, Escalated}` — **whitelist**
  (khớp handler BE dòng 58, giống `canEscalate` có sẵn ở TicketDetailPage:236). KHÔNG dùng blacklist
  `New/Resolved/Closed*/Merged` vì bỏ sót `WaitingCustomer/WaitingParts/WaitingOnsiteSchedule` — mấy status
  này BE **cũng chặn** (không nằm trong whitelist) nhưng blacklist của bản plan cũ để lọt.
  → dialog: Select priority + Textarea reason (bắt buộc, ≤ 1000)
  → `mutateAsync`
  → OK: invalidate ticket **detail + activity timeline + participants + assignment** (KHÔNG tự tính SLA mới).
    ⚠️ **BE tự động escalate + hạ primary handler** khi đổi lên priority mà tier staff không đủ
    (handler `EscalateForInsufficientPrimaryTierAsync`, gọi ở dòng 91 TRƯỚC khi đọc `ticket.Status`): ticket
    có thể **đổi cả status→Escalated lẫn assignee** sau re-prioritize, không chỉ priority.
    **Phát hiện qua `data.status === "Escalated"`** trong response (KHÔNG dùng `warnings`: field
    `TicketActionDTO.Warnings` tồn tại nhưng handler re-prioritize **không bao giờ set** — dòng 112-116 chỉ
    set Id/Code/Status). Nếu `data.status === Escalated` → BE vừa auto-escalate → toast thông báo Manager +
    invalidate participants/assignment. Luôn invalidate detail nên assignee mới luôn hiện đúng dù không đọc warnings.
  → FAIL: `handleErrorApi({ error, setError })`; 409 → toast + refetch ticket, **không auto-retry**

## Edge Cases
- **PUT matrix trùng `category`** → BE 400 `"Nhóm '{tên}' xuất hiện nhiều lần"`. Form giữ 6 dòng unique nên không xảy ra; vẫn map lỗi qua `handleErrorApi`.
- **test-send vượt hạn mức** → 429 `"Đã dùng hết 5 lượt gửi thử trong giờ này."` → toast lỗi, disable nút tới cuối giờ (dựa `remainingThisHour === 0`).
- **test-send template không phải Email** → 400 — chặn từ FE bằng cách disable nút.
- **Template hỏng cú pháp Handlebars** → 400 `"Template hỏng cú pháp: ..."` → hiện trong dialog preview, không toast trôi mất.
- **`/opened` idempotent** → gọi lại vẫn 200, không cần chặn double-click.
- **Badge unread-count — BE loại CẢ `Read` LẪN `Opened`, chỉ đếm `Channel = InApp`**: verified handler thật `GetUnreadCountQueryHandler.cs:24-32` (`Status != Read && Status != Opened && Channel == InApp`). ⚠️ XML comment ở `NotificationsController.cs:244` ghi "`Status != Read`" là **stale**, đừng tin. → Badge dùng thẳng số BE trả (không vỡ). Nhưng **mọi chỗ FE tự tính "chưa đọc" ở client** (list trong `NotificationBell`, styling item đậm/nhạt, filter `unreadOnly`) hiện chỉ so `status !== Read` → **phải loại đủ CẢ 2** (`status !== Read && status !== Opened`), nếu không noti đã `Opened` vẫn hiện đậm như chưa đọc, lệch server.
- **`AccountStatusEnum` style pitfall**: enum notification serialize **số**; không dùng truthy-check với giá trị enum.
- **re-prioritize 409** → ticket đã đổi state ở tab khác → toast `message` từ BE + refetch, không retry.
- **re-prioritize auto-escalate (BE side-effect)** → đổi lên priority cao mà primary handler thiếu tier → BE tự chuyển `status→Escalated` + gỡ primary handler xuống PreviousPrimaryHandler. FE: phát hiện qua `data.status === "Escalated"` → toast báo Manager + invalidate participants/assignment. Manager thấy ticket vừa đổi assignee là **đúng behavior**, không phải bug. (KHÔNG dựa `warnings` — handler không set.)
- **Loading/error**: mọi section mới có skeleton + nút thử lại theo pattern `NotificationPreferencesSection`.

## Acceptance Criteria
- [ ] AccountSettings có section "Thông báo theo nhóm": 6 nhóm × 4 kênh, badge "Kế thừa" đúng với `isCustomized`
- [ ] Đổi 1 nhóm rồi Lưu → chỉ nhóm đó nằm trong `items` của PUT; reload trang thấy giá trị mới
- [ ] Kênh toàn cục tắt → ô kênh tương ứng ở mọi nhóm bị disable
- [ ] Click notification ticket trong Bell → gọi `PATCH /opened` (không phải `/read`) + điều hướng đúng ticket
- [ ] `/admin/notification-templates` list được template, lọc theo type/channel/locale, bản active có badge
- [ ] Preview render đúng title/body với sampleData nhập vào; template lỗi cú pháp hiện message trong dialog
- [ ] Gửi thử chỉ bật với template Email; thành công hiện số lượt còn lại; 429 hiện lỗi rõ ràng
- [ ] Activate bản cũ → list refetch, badge "Đang dùng" chuyển sang bản vừa kích hoạt
- [ ] Manager mở ticket đang xử lý → thấy nút "Đổi mức ưu tiên"; submit thiếu reason bị chặn ở FE
- [ ] Re-prioritize thành công → priority + SLA countdown + activity timeline cập nhật (từ refetch, không tự tính); nếu `data.status === Escalated` (BE auto-escalate) → toast báo Manager + status/assignee cũng cập nhật từ refetch
- [ ] `npx tsc --noEmit` + `npx eslint . --max-warnings=0` + `npm run build` PASS

## Steps
- [x] Bước 1: Enums + Types — `notification.enum.ts` (status/type/category), `notification-matrix.types.ts`, `notification-template.types.ts` — 2026-08-01
- [x] Bước 2: Endpoints + queryKeys — 2026-08-01 — 4 nhóm key mới
- [x] Bước 3: Schemas — matrix form, template sampleData, reprioritize — 2026-08-01
- [x] Bước 4: Services — `notification-matrix.service.ts`, `notification.service.ts` (+markOpened), `notification-template.service.ts`, manager `ticket.service.ts` (+reprioritize) — 2026-08-01
- [x] Bước 5: Hooks — `useNotificationMatrix`, `useMarkNotificationOpened`, `useNotificationTemplates`, `useReprioritizeTicket` — 2026-08-01
- [x] Bước 6: Components + Pages — matrix section, template table/dialog/page, ReprioritizeDialog, NotificationBell — 2026-08-01
- [x] Bước 7: Router + adminNav — 2026-08-01
- [x] Bước 8: `tsc --noEmit` ✅ + `eslint --max-warnings=0` ✅ + `npm run build` ✅ — 2026-08-01

## Ghi chú phát sinh khi implement (ngoài plan gốc)
| Thay đổi | Lý do |
|---|---|
| `shared/enums/notification/notification.enum.ts` — thêm helper `isUnreadStatus()` | Định nghĩa "chưa đọc" phải khớp BE (loại cả `Read` lẫn `Opened`). Đặt 1 chỗ để `NotificationBell` và mọi chỗ tự tính unread sau này không lệch nhau. |
| `shared/constants/messages.ts` + `manager/constants/messages.ts` | Thêm message cho matrix (saved / no-change) và re-prioritize (thường / kèm auto-escalate) — theo convention sẵn có, không hardcode chuỗi trong component. |
| `NotificationTemplatePreviewDialog` dùng `key={id}` ở page thay vì `useEffect` reset | ESLint `react-hooks/set-state-in-effect` — setState trong effect gây cascading render. |
| `NotificationCategoryMatrixSection` bỏ `watch()` | ESLint `react-hooks/incompatible-library` — React Compiler không memo được `watch()` của RHF. Guard nút Lưu chuyển sang `data.categories.length`. |
| `NotificationTemplatesPage` — `onValueChange={(v) => f.onChange(v ?? ALL)}` | `tsc -b` (build) bắt lỗi Select trả `string \| null` mà `tsc --noEmit` bỏ qua. |
| **Ngoài scope (user duyệt):** `CascadeRiskSummary.tsx:116` + `SiteDashboardCard.tsx:100` — `(value: any)` → `(value: unknown)` + `String(value)` | 2 lỗi `no-explicit-any` CÓ SẴN từ nhánh base `fix/kb-ui-cleanup` (2 file này không có trên `main`), chặn gate `eslint --max-warnings=0`. Không dùng `number \| string` vì Recharts `Formatter` truyền `ValueType \| undefined` → `unknown` là kiểu duy nhất vừa hợp lệ vừa không phải `any`. |

## Câu hỏi đã giải đáp
| Câu hỏi | Chốt |
|---|---|
| SMS cancel không có API list messages cho Admin | Gỡ khỏi #160 — BE cần thêm `GET /api/admin/sms-gateway/messages` (đã note cuối issue) |
| Voice retry — `voiceTranscriptionStatus` luôn null ở `GET /chats` | Gỡ khỏi #160 — BE cần map 3 field vào `TicketChatsQueryHandler` / `TicketChatsCursorQueryHandler` / `ChatGetByIdQueryHandler` (đã note cuối issue) |
| Unsubscribe — FE có sở hữu trang không? | Không. `PublicBaseUrl = https://api.{domain}` (helm configmap:44) → link trỏ BE; `GET` trả JSON. BE cần render HTML hoặc đổi path |
| Ma trận đặt ở đâu, tránh đụng #97? | Section mới trong AccountSettings + file service/types/hook riêng; không sửa file của #97 |
| Web gọi `/opened` lúc nào? | Chỉ khi click item có deep-link; item thường vẫn `/read` — giữ đúng ngữ nghĩa open-rate |
| UI template đặt đâu? | Trang riêng `/admin/notification-templates` + mục sidebar |
| Đồng bộ enum tới đâu? | status (+Delivered:5/Opened:6), type **19→33** (bỏ TicketMerged do BE trùng value 27), category 1–6 |
| **Verify BE (2026-08-01)** | Đọc trực tiếp controller + DTO + enum + **handler** (không chỉ comment). Chốt: (1) type range 19→33, `TicketMerged=27` alias trùng `ChatEscalatedToAdmin=27` → bỏ TicketMerged; (2) categories count không hardcode; (3) **unread-count BE loại CẢ Read LẪN Opened + chỉ đếm InApp** (`GetUnreadCountQueryHandler.cs:24-32`; comment controller:244 stale) → FE tự-tính-unread phải loại đủ 2; (4) bỏ NotificationMatrixChannelsDto thừa; (5) re-prioritize auto-escalate phát hiện qua `data.status===Escalated` (handler KHÔNG set warnings). Serialize: NotificationService=**number** (không JsonStringEnumConverter), TicketService=**string** (có) → matrix category=số, template type/channel=chuỗi, re-prioritize status=chuỗi. |
| **Docs BE sai (cần BE sửa riêng)** | `backend/docs/api-notification.md` bảng type (dòng ~152-183) **thiếu `BlogGenerationCompleted=25`/`BlogGenerationFailed=26`** → đánh số lệch 2 từ ChatEscalatedToAdmin trở đi (docs ghi 25, code là 27). **KHÔNG lấy docs làm nguồn cho enum FE** — chỉ tin `NotificationTypeEnum.cs`. Note để BE sửa docs. |
| **FE type #97 thiếu 4 field chat** | `shared/types/notification/notification-preference.types.ts` (của #97) hiện chỉ 7 field, CHƯA có `notifyOnChat/notifyOnMention/notifyOnReaction/digestWindowMinutes`. Section matrix chỉ render `categories` nên KHÔNG ảnh hưởng. Nếu về sau cần đọc `channels.notifyOnChat` thì phải bổ sung vào file #97 (ngoài scope #160). |
