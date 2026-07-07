# Plan — GH-133: Khai báo & wire endpoint FE còn thiếu (Nhóm C)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-07-07
- **Issue:** #133 — https://github.com/GSU26SE55/frontend/issues/133
- **Sprint:** Sprint 4 (deadline 2026-07-11)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Khai báo + wire **đầy đủ (full: endpoints + types + service + hooks + UI)** 8 endpoint BE mà FE web
chưa gọi (Nhóm C audit). BE đã build & deploy đủ cả 8 (verified trực tiếp trên `backend@dev` — route
signature dẫn ở "Trạng thái verify" bên dưới). Nhóm C5-SMS (`sms-gateway/messages/{id}/cancel`) **đã
loại khỏi scope** — SMS là app riêng, BE cũng không có endpoint list messages, và màn
`/admin/sms-gateway` hiện chỉ quản lý devices.

## Trạng thái verify (on-disk — chính xác theo endpoint, không overstate)
> **Đính chính:** phát biểu ban đầu "0 match / 8 endpoint chưa có ở đâu" là **overstated**. Chat *base*
> và các path *lân cận* đã có; đúng **8 sub-path Group C** thì chưa có. Đối chiếu từng cái:

| # | Endpoint C | Trạng thái FE | Path lân cận đã có (KHÁC) | BE route (verified) |
|---|---|---|---|---|
| C1 | `GET /api/permissions` | ❌ chưa có | `ADMIN.PERMISSIONS.LIST=/api/admin/permissions` (Admin-only), `AUTH.ME_PERMISSIONS` | `PermissionsController [Route("api/permissions")] [HttpGet]` |
| C2a | `POST chats/suggest` | ❌ | — | `TicketChatsController [HttpPost("suggest")]` |
| C2b | `POST chats/sentiment-check` | ❌ | — | `[HttpPost("sentiment-check")]` |
| C2c | `POST chats/summarize` | ❌ | — | `[HttpPost("summarize")]` |
| C2d | `GET chats/export-pdf` | ❌ | — | `[HttpGet("export-pdf")]` |
| C3 | `GET chats/{cid}/attachments/{aid}/download` | ❌ | `CHAT_ATTACHMENT` (:70, **không** `/download`); `FILES.DOWNLOAD` (:413, file-storage generic) | `[HttpGet("{id}/attachments/{attachmentId}/download")]` → `CommonResponse<string>` (202/451) |
| C4 | `PUT`+`DELETE .../chats/{cid}/closed-override` | ❌ (chỉ có `CHAT_CLOSED_OVERRIDE(tid)` = **POST-add** base, :265) | `CHAT_CLOSED_OVERRIDE` POST-base (:265), `CHAT_RESTORE` (:266) | `AdminTicketChatsController [Route("api/admin/tickets/{ticketId}/chats")]` + `[HttpPut("{id}/closed-override")]` / `[HttpDelete("{id}/closed-override")]` |
| C5 | `GET /api/admin/files/audit-logs` | ❌ | `ADMIN.AUDIT_LOGS`, battery/alert/ticket audit-logs | `FileStorageService AdminAuditLogsController [HttpGet("api/admin/files/audit-logs")]` → `CommonResponse<PaginationResponse<FileAuditLogDto>>` |

## Scope
**Trong scope (8 endpoint, 5 nhóm):**
- **C1** `GET /api/permissions` — catalog permission dùng chung mọi role (khác `/api/admin/permissions` Admin-only).
- **C2** AI chats (Staff/Manager/Admin): `POST chats/suggest`, `POST chats/sentiment-check`, `POST chats/summarize`, `GET chats/export-pdf`.
- **C3** `GET chats/{cid}/attachments/{aid}/download` — download có virus-scan gating.
- **C4** `PUT` + `DELETE /api/admin/tickets/{tid}/chats/{cid}/closed-override` — Admin sửa/xóa chat trên ticket Closed.
- **C5** `GET /api/admin/files/audit-logs` — trang audit GDPR truy cập file (Admin).

**Ngoài scope:**
- SMS gateway cancel (C5-SMS) — app riêng, không đụng.
- Đổi contract/BE — chỉ consume endpoint đã có.
- C1: KHÔNG dựng picker Manager/Staff mới (chưa có consumer nghiệp vụ) — chỉ deliver endpoint + service + hook dùng chung; hiện chưa có màn hình nào render catalog cho non-admin.

## Endpoints
| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/permissions?module=` | query `module?` | `CommonResponse<PermissionDto[]>` (Id, Code, Module, Description, IsSystemPermission) |
| POST | `/api/tickets/{tid}/chats/suggest` | `{ intent: ChatAiIntentEnum }` | `CommonResponse<ChatSuggestDTO>` (`suggestionId`, `suggestions[3]`) |
| POST | `/api/tickets/{tid}/chats/sentiment-check` | — | `CommonResponse<ChatSentimentCheckDTO>` (`score`, `label`, `isAlertSent`) |
| POST | `/api/tickets/{tid}/chats/summarize` | — | `CommonResponse<ChatSummarizeDTO>` (`summary`) |
| GET | `/api/tickets/{tid}/chats/export-pdf` | — | `application/pdf` (blob, `ticket-{tid}-chats.pdf`) |
| GET | `/api/tickets/{tid}/chats/{cid}/attachments/{aid}/download` | — | `CommonResponse<string>` (url) · 202 scanning · 451 infected |
| PUT | `/api/admin/tickets/{tid}/chats/{cid}/closed-override` | `{ body, overrideReason }` | `TicketActionResponse` |
| DELETE | `/api/admin/tickets/{tid}/chats/{cid}/closed-override` | `{ overrideReason }` | `TicketActionResponse` |
| GET | `/api/admin/files/audit-logs?action&fileId&from&to&pageNumber&pageSize` | query filters | `CommonResponse<PaginationResponse<FileAuditLogDto>>` |

## Enums
| Enum | File nguồn | Ghi chú |
|------|-----------|---------|
| ChatAiIntentEnum | `shared/enums/chat.enum.ts` (create) | dùng cho `chats/suggest` — values theo `docs/api-ticket.md §309` |

## Types
```ts
// shared/types/chat.types.ts (modify — thêm)
interface ChatSuggestDTO { suggestionId: string; suggestions: string[]; }
type ChatSentimentLabel = "Positive" | "Neutral" | "Negative" | "Critical";
interface ChatSentimentCheckDTO { score: number; label: ChatSentimentLabel; isAlertSent: boolean; }
interface ChatSummarizeDTO { summary: string; }

// features/admin/types/file-audit.types.ts (create — CHỈ params; row dùng lại type audit chung)
// Row = BatteryAuditLogDto (shape audit chung: id,eventId,actionCode,actionCategory,severity,
//   targetId,targetDisplay,actorAccountId,isSuccess,reason,occurredAt). BE files-audit KHÔNG trả
//   actionCategory → service map actionCategory = "" khi đọc response.
export type FileAuditLogDto = BatteryAuditLogDto; // re-export alias, không định nghĩa shape mới
interface FileAuditLogParams { action?: string; fileId?: string; from?: string; to?: string;
  pageNumber?: number; pageSize?: number; }  // mirror BatteryAuditLogParams (đổi batteryId→fileId)
```
> **Reuse (P4 review):** KHÔNG tạo DTO/table/filter mới. C5 dùng lại `BatteryAuditLogDto` (row),
> `AuditLogFilterBar` (filter, `targetLabel="File ID"`), `BatteryAuditLogTable` (bảng),
> `DataPagination`, `RefreshButton`.
> C1 dùng `PermissionDto` đã có sẵn ở `features/auth/types/permission.types.ts` (không tạo lại).

## Schema (Zod)
- C4 override edit: `{ body: z.string().min(1), overrideReason: z.string().min(1) }` (`admin/schemas/chat-override.schema.ts`)
- C4 override delete: `{ overrideReason: z.string().min(1) }`
- C5 filter form (nếu có form filter): reuse pattern audit hiện có, không bắt buộc Zod nếu chỉ là controlled inputs.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | C1 `AUTH.PERMISSIONS_CATALOG`; C2 `TICKETS.CHAT_SUGGEST/CHAT_SENTIMENT/CHAT_SUMMARIZE/CHAT_EXPORT_PDF`; C3 `CHAT_ATTACHMENT_DOWNLOAD`; C4 `ADMIN.CHAT_CLOSED_OVERRIDE_ITEM(tid,cid)`; C5 `ADMIN.FILES_AUDIT_LOGS` |
| `src/shared/utils/queryKeys.ts` | modify | key cho `filesAudit.list(params)`, `permissionsCatalog(module)` |
| `src/shared/enums/chat.enum.ts` | create | `ChatAiIntentEnum` |
| `src/shared/types/chat.types.ts` | modify | `ChatSuggestDTO`, `ChatSentimentCheckDTO`, `ChatSummarizeDTO`, `ChatSentimentLabel` |
| `src/shared/services/ticket-chat-actions.service.ts` | modify | (đã tồn tại) thêm `suggest`, `sentimentCheck`, `summarize`, `exportPdf` (blob), `downloadAttachment` cạnh update/remove/markRead/translate/transcribeVoice |
| `src/shared/hooks/useTicketChatActions.ts` | modify | **(P3)** file đã có 5 hook — THÊM `useSuggestChat`, `useSentimentCheck`, `useSummarizeChat`, `useExportChatPdf`, `useDownloadChatAttachment` vào đây (không tạo `useChatAi.ts` mới) |
| `src/shared/components/common/ChatAiPanel.tsx` | create | C2 UI: nút Suggest/Summarize/Sentiment/Export trong thread (chỉ Staff/Manager/Admin) |
| `src/shared/components/common/TicketCommentThread.tsx` | modify | render `ChatAiPanel`; truyền callback insert-suggestion vào composer |
| `src/shared/components/common/TicketAttachments.tsx` | modify | thêm nút download qua C3 (thay/thêm cạnh presigned url hiện có) |
| `src/features/{staff,manager,admin}/components/AddCommentForm.tsx` | modify | nhận suggestion từ ChatAiPanel để chèn vào ô soạn |
| `src/features/auth/services/permission.service.ts` | modify | C1 — thêm `getCatalog(module?)` dùng `PERMISSIONS_CATALOG` |
| `src/features/auth/hooks/usePermissionsCatalog.ts` | create | C1 — useQuery, staleTime 5 phút |
| `src/features/admin/services/admin-ticket-chats.service.ts` | create | C4 — `overrideEdit`, `overrideDelete` |
| `src/features/admin/schemas/chat-override.schema.ts` | create | C4 — zod edit/delete |
| `src/features/admin/hooks/useAdminChatOverride.ts` | create | C4 — `useOverrideEditChat`, `useOverrideDeleteChat` |
| `src/features/admin/components/AdminClosedOverrideDialog.tsx` | create | C4 — dialog edit/delete (bắt buộc `overrideReason`) |
| `src/features/admin/pages/AdminTicketDetailPage.tsx` | modify | C4 — hiện affordance edit/delete override khi ticket Closed |
| `src/features/admin/types/file-audit.types.ts` | create | C5 — chỉ `FileAuditLogParams` + `FileAuditLogDto = BatteryAuditLogDto` alias (KHÔNG shape mới) |
| `src/features/admin/services/file-audit-logs.service.ts` | create | C5 — mirror `battery-audit-logs.service.ts`; map `actionCategory=""` (BE không trả) |
| `src/features/admin/hooks/useFileAuditLogs.ts` | create | C5 — useQuery paginated (mirror `useBatteryAuditLogs`) |
| `src/features/admin/pages/FilesAuditLogsPage.tsx` | create | C5 — **reuse** `AuditLogFilterBar` (`targetLabel="File ID"`) + `BatteryAuditLogTable` + `DataPagination` + `RefreshButton` |
| `src/router/index.tsx` | modify | C5 — route `files-audit-logs` |
| `src/shared/components/layout/AppLayout.tsx` | modify | C5 — nav item "Audit File" nhóm HỆ THỐNG |

## Approach
- **Không gọi API trong component** — mọi call qua `services/` → TanStack Query hook. Không tạo axios instance mới.
- **C2 (AI):** dùng `useMutation` (không cache — mỗi lần bấm là 1 lần gọi). `ChatAiPanel` đặt trong `TicketCommentThread` (shared, render ở cả 3 role) — gate bằng `checkRole(user,'STAFF','MANAGER','ADMIN')`. Suggest trả 3 gợi ý → user chọn → chèn vào `AddCommentForm` composer. Summarize/sentiment hiện qua dialog/badge. Export-pdf: service trả `Blob` (`responseType:'blob'`) → tạo `URL.createObjectURL` → trigger download.
- **C3 (download):** mutation gọi endpoint → 200 lấy url mở tab/tải; 202 → toast "file đang quét virus, thử lại"; 451 → toast "file nhiễm virus, không tải được". Wire nút vào `TicketAttachments`.
- **C4 (override):** service admin riêng, hook mutation → `onError: handleErrorApi({error})` (non-form dạng dialog dùng try-catch + setError). Sau success `invalidateQueries` chat list của ticket. UI chỉ hiện khi ticket ở `Closed`/`ClosedPendingRate` và role Admin.
- **C5 (files-audit):** **reuse infra audit sẵn có** (không mirror-copy): `AuditLogFilterBar` (`targetLabel="File ID"`, `actionOptions` = tập action file audit vd `FileDownloaded`), `BatteryAuditLogTable`, `DataPagination`, `RefreshButton`; row type = `BatteryAuditLogDto`. Chỉ thêm service + hook + params + page + route + nav. staleTime theo pattern audit hiện hành.
- **C1 (permissions catalog):** thêm method `getCatalog` vào `permission.service.ts` (auth feature — đã có `PermissionDto`) + hook `usePermissionsCatalog`. Chưa có màn hình non-admin dùng → deliver ở mức callable layer, không dựng UI mới (Simplicity First).

## Edge Cases
- C2 suggest/sentiment/summarize: BE trả `isSuccess:false, message:"AI service đang bận…"` khi Gemini 429 → hiện message đó, không throw đỏ.
- C2 export-pdf & C3 download: 404 (ticket/chat/attachment không tồn tại hoặc không có chat) → toast.
- C3: 202 (đang scan) và 451 (nhiễm virus) là "thành công HTTP" nhưng không có url → xử lý theo statusCode/flag, không coi là lỗi network.
- C4: thiếu `overrideReason` → BE 400; FE chặn sớm bằng Zod. Chỉ Admin (403 nếu sai role) — gate UI bằng role.
- C5: `pageSize` trần 100 (BE tự cap); FE gửi mặc định 50. Filter rỗng = trả tất cả.
- C1: token hết hạn → 401 (interceptor tự refresh/logout).

## Acceptance Criteria
- [ ] Cả 8 endpoint khai báo trong `endpoints.ts` (không hardcode URL trong service).
- [ ] C2: 4 nút AI hoạt động trong chat thread (Staff/Manager/Admin); suggest chèn được vào composer; export-pdf tải file `.pdf`.
- [ ] C3: nút download attachment hoạt động; xử lý đúng 200/202/451.
- [ ] C4: Admin edit/delete được chat trên ticket Closed qua dialog bắt buộc `overrideReason`; list chat refresh sau thao tác.
- [ ] C5: trang `/admin/files-audit-logs` hiển thị bảng audit có filter + phân trang; có nav item.
- [ ] C1: `usePermissionsCatalog` gọi `/api/permissions` trả về catalog (verify bằng call thật).
- [ ] `npx tsc --noEmit` PASS · `npx eslint . --max-warnings=0` PASS · `npm run build` PASS.
- [ ] Không cross-feature import (admin↔manager↔staff) — shared là nơi duy nhất tái sử dụng.

## Steps
- [x] Bước 1 — Types + Enums: `chat.enum.ts` (ChatAiIntentEnum), `chat.types.ts` (AI DTOs), `file-audit.types.ts`; `endpoints.ts` + `queryKeys.ts`. — 2026-07-07 (tsc PASS)
- [x] Bước 2 — Services: chat AI + download (`ticket-chat-actions.service.ts`), C4 override (thêm vào `admin/services/ticket-chat.service.ts` sẵn có — KHÔNG tạo file mới, tránh trùng domain), `file-audit-logs.service.ts` (C5), `permission.service.getCatalog` (C1), `chat-override.schema.ts` (C4 zod). — 2026-07-07 (tsc PASS)
- [x] Bước 3 — Hooks: mở rộng `useTicketChatActions.ts` (useSuggestChat/useSentimentCheck/useSummarizeChat/useExportChatPdf/useDownloadChatAttachment); tạo `useAdminChatOverride` (edit+delete), `useFileAuditLogs`, `usePermissionsCatalog`. — 2026-07-07 (tsc PASS)
- [x] Bước 4 — Components + Pages: `ChatAiPanel` + wire vào `TicketCommentThread` (3 role pages truyền `ticketId`+`aiEnabled`), download vào `TicketAttachments` (C3), `AdminClosedOverrideDialog` + wire `AdminTicketDetailPage` (C4), `FilesAuditLogsPage` + route + nav (C5). — 2026-07-07
- [x] Bước 5 — Quality gate: `tsc --noEmit` ✓ · `eslint . --max-warnings=0` ✓ · `npm run build` ✓. — 2026-07-07

## Deviations so với plan (đã ghi để reviewer nắm)
- **C4 service:** thêm `overrideEdit`/`overrideDelete` vào `admin/services/ticket-chat.service.ts` sẵn có thay vì file `admin-ticket-chats.service.ts` mới (tránh trùng domain — cùng lý do A2).
- **C2 suggest UX:** gợi ý AI **sao chép vào clipboard** (nút Copy) thay vì auto-fill composer. Lý do: composer là 3 form RHF riêng theo role (`AddCommentForm`) đang được GH-132 sửa; clipboard giữ `ChatAiPanel` self-contained (chỉ cần `ticketId`), tránh cross-cutting 3 form + regression. Auto-fill có thể làm follow-up nếu cần.
- **C3 attachmentId:** BE `ChatAttachmentDownloadQueryHandler` khớp `{attachmentId}` theo `a.FileId` → dùng luôn `fileId` (thứ FE có sẵn ở comment) + `chatId=comment.id`. Không cần fetch attachment record id.
- **C1 UI:** giữ callable-layer (endpoint + `permissionService.getCatalog` + `usePermissionsCatalog`). KHÔNG dựng UI vì không có màn Manager/Staff nào tiêu thụ catalog (Simplicity First). Sẵn sàng wire khi có consumer.

## Status
- **Status:** IN_PROGRESS → **REVIEWING** (2026-07-07). Chạy tiếp `/kltn-reviewcode` → `/kltn-test` → `/kltn-ship 133`.

## Câu hỏi đã giải đáp
- **BE đã build 8 endpoint chưa?** → Đã build & deploy đủ trên `backend@dev` (verified trực tiếp: controllers có handler thật, không phải stub).
- **8 endpoint này FE đã có sẵn chưa?** → Đã audit 3 nhánh (HEAD, `chat-auditlog-iot_ui`, `origin/dev`): chat *base* (#121) và các path *lân cận* đã có; đúng **8 sub-path Group C** thì chưa (xem bảng "Trạng thái verify"). Phát biểu cũ "0 match / chưa có ở đâu" đã đính chính vì overstated.

## Đối chiếu review (P1–P5) — đã xử lý
- **P1 (C4 contract):** Plan đúng — BE nhận per-chat `{cid}` cho PUT/DELETE (`AdminTicketChatsController [HttpPut/HttpDelete("{id}/closed-override")]`). `CHAT_CLOSED_OVERRIDE(tid)` hiện có chỉ là POST-add base. Đã bổ sung route signature làm dẫn chứng.
- **P2 (overstate):** Đã sửa — thêm bảng "Trạng thái verify" chính xác từng endpoint (base tồn tại, sub-path Group C chưa).
- **P3 (chat AI hook):** Đã sửa — mở rộng `shared/hooks/useTicketChatActions.ts` (đã có 5 hook), KHÔNG tạo `useChatAi.ts`/`useDownloadChatAttachment.ts` mới. Service `ticket-chat-actions.service.ts` cũng đã tồn tại → chỉ thêm method.
- **P4 (C5 reuse):** Đã sửa — reuse `BatteryAuditLogDto` + `AuditLogFilterBar` + `BatteryAuditLogTable` + `DataPagination`; chỉ thêm `FileAuditLogParams` + service + hook + page. Lưu ý BE files-audit KHÔNG trả `actionCategory` → map `""`.
- **P5 (C3 distinct):** Xác nhận endpoint C3 KHÁC `CHAT_ATTACHMENT`(:70) và `FILES.DOWNLOAD`(:413) — BE `[HttpGet("{id}/attachments/{attachmentId}/download")]` trả `CommonResponse<string>` với 202/451.
- **C2 DTO verify:** `ChatSuggestDTO { suggestionId, suggestions[] }` khớp BE source (`ChatSuggestResponse.cs`) + docs §309; `ChatAiIntentEnum` = RequestInfo/TechnicalAnswer(default)/Resolution/FollowUp (1–4).

## Đối chiếu review round 2 (A1–A5) — đã xử lý
- **A1 (C4 route):** Plan đã ghi `ADMIN.CHAT_CLOSED_OVERRIDE_ITEM(tid,cid) = /api/admin/tickets/${tid}/chats/${cid}/closed-override`, TÁCH BIỆT với `CHAT_CLOSED_OVERRIDE(tid)` (:265, POST-add). Không ghi đè dòng cũ.
- **A2 (trùng domain):** Đã hợp nhất — thêm method vào `ticket-chat-actions.service.ts` (đã tồn tại) + hook vào `useTicketChatActions.ts` (đã có 5 hook). KHÔNG tạo `useChatAi.ts`.
- **A3 (C2 response fields — VERIFIED verbatim BE):** cả 3 là `CommonResponse<XxxDTO>`:
  - `ChatSuggestDTO`: `SuggestionId: string`, `Suggestions: string[]`
  - `ChatSentimentCheckDTO`: `Score: double`, `Label: string`, `IsAlertSent: bool`
  - `ChatSummarizeDTO`: `Summary: string`
  → JSON camelCase FE consume: `suggestionId/suggestions`, `score/label/isAlertSent`, `summary`. Types trong plan đã đúng, không còn "đoán theo docs".
- **A4 (path param):** `cid` (chat id) map vào `{id}` của BE route (`{ticketId}` = tid base). Đã note trong service.
- **A5 (C5 pagination — VERIFIED):** BE `PaginationResponse<T>.TotalPages` (`=> Math.Ceiling(TotalItems/PageSize)`) và `HasNextPage` (`=> PageNumber < TotalPages`) là **computed getter** → serialize vào JSON dù handler files-audit chỉ set `Items/TotalItems/PageNumber/PageSize`. FE `PaginationResponse<T>` có đủ `totalPages/hasNextPage` → mirror `BatteryAuditLogsPage` + `DataPagination` chạy trực tiếp, không cần tự tính.
- **Depth?** → Full: endpoints + types + service + hooks + UI cho tất cả.
- **C5-SMS cancel?** → Loại khỏi scope (app SMS riêng; BE không có list-messages; màn sms-gateway chỉ quản device).
- **C1 có consumer Manager/Staff không?** → Chưa. Deliver callable layer (endpoint+service+hook), không dựng picker mới.
