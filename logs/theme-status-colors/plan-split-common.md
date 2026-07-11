# Plan — Tách `shared/components/common/` theo domain (xóa common/)

## Metadata
- **Role:** FE | **Ngày:** 2026-07-11 | Task nội bộ (không GH number)
- **Scope:** 27 file trong `common/` (KHÔNG tính `common/kb/`) · 158 import site ngoài

## Mục tiêu
`common/` là "thùng chứa tạp" 27 file lẫn nhiều domain (ticket/chat/dashboard/site/media + util UI), trong khi alerts/iot/environmental đã tách folder riêng. Tách `common/` thành 6 folder domain rõ ràng và **xóa `common/`**. `common/kb/` → thành `kb/` (nâng lên 1 cấp, vì common biến mất).

## Mapping 27 file → domain đích

### → `shared/components/ticket/`
| File | |
|------|--|
| TicketStatusBadge, TicketPriorityBadge | badge ticket |
| TicketCommentThread, TicketAttachments | comment/đính kèm ticket |
| ProcessingDurationTimer, ticketActivityMeta | timer + activity log ticket |

### → `shared/components/chat/`
| File | |
|------|--|
| ChatAiPanel, ChatReactionBar, TypingIndicator | chat realtime |
| VoiceRecordingBar | ghi âm để gửi |
| AttachmentPreviewStrip | preview ảnh sắp gửi trong chat |

### → `shared/components/dashboard/`
| File | |
|------|--|
| KpiCard, DashboardPanel, Sparkline | KPI + chart |
| LiveTelemetryCard | telemetry live (SSE) |
| CascadeRiskSummary | ⚠️ heat-map tổng nhiều site — dashboard (xem "Điểm cần quyết") |

### → `shared/components/site/`
| File | |
|------|--|
| SiteDashboardCard, SiteAssetsTable | dashboard/table theo 1 site |

### → `shared/components/media/`
| File | |
|------|--|
| AuthImage | hiển thị ảnh có auth (generic) |
| VoiceMessagePlayer | phát audio đã gửi |

### → `shared/components/ui/`
| File | |
|------|--|
| DataPagination, RefreshButton, SortableTableHead | table/query util |
| EmptyState, ErrorState | feedback state |
| TagInput, ThemeToggle | input/toggle generic |

### `common/kb/` → `kb/`
Toàn bộ subfolder kb chuyển thành `shared/components/kb/` (import `@/shared/components/common/kb/*` → `@/shared/components/kb/*`).

## Cross-import nội bộ cần đổi path (tự xử lý khi rewrite toàn bộ)
- TicketCommentThread (ticket) → TicketAttachments (ticket), VoiceMessagePlayer (media), ChatAiPanel (chat), ChatReactionBar (chat)
- AttachmentPreviewStrip (chat) → AuthImage (media)
- TicketAttachments (ticket) → AuthImage (media)
- kb/KbEditorPanel → TagInput (ui)

## Cách làm (an toàn, cơ học)
1. Tạo 6 folder đích + `kb/`.
2. `git mv`/`mv` từng file về đúng folder (bảng trên).
3. **Rewrite toàn bộ import** bằng mapping cụ-thể-từng-file (không dùng 1 regex chung, vì mỗi file đi 1 domain khác nhau). Áp cho CẢ 158 site ngoài LẪN cross-import nội bộ.
4. Xóa `common/` (đã rỗng).
5. Verify: `tsc --noEmit` + `eslint --max-warnings=0` + `vite build`.

> Vì mỗi file map tới domain riêng, rewrite phải theo **bảng tên-file → path mới** (script sinh sed per-file), không thể 1 lệnh `common/ → x/`.

## Điểm cần bạn quyết
- **CascadeRiskSummary**: agent xếp **dashboard** (heat-map tổng nhiều site). Nếu bạn coi nó thuộc **site** (vì dùng `SiteCascadeRiskSummaryDto`) thì đổi. → Mặc định: **dashboard**.

## PHẦN 2 — Gom title vào `shared/utils/` (2 khái niệm KHÁC NHAU)

> ⚠️ Phân biệt rõ 2 thứ dễ nhầm:
> - **Overview panels** = title các `<DashboardPanel>` **bên trong trang Tổng quan** (route mặc định `/{role}/dashboard`).
> - **Sidebar sections** = title các **nhóm menu ở sidebar trái** (Hạ tầng pin / Hỗ trợ / …) trong `AppLayout`.
> Đây KHÔNG phải cùng một thứ, và cũng khác với folder `shared/components/dashboard/` ở PHẦN 1.

### 2a. Overview panels — `src/shared/utils/overviewPanels.ts`
3 DashboardPage (admin/manager/staff) hardcode 19 `title="..."` (prop của `<DashboardPanel>`). Gom thành 1 constant.
```ts
export const OVERVIEW_PANELS = {
  admin:   { alerts7d, alertsByType, slaSystem, batteryByStatus, usersByRole, siteHealth, systemLog },
  manager: { ticketPipeline, sla, newTickets7d, staffLoad, triageQueue, sitesNeedAttention },
  staff:   { personalSla, tickets7d, ticketStatus, priority, slaRisk, recentNotifications },
} as const;
```
Giá trị = đúng chuỗi tiếng Việt đang hardcode (Cảnh báo 7 ngày, Tuân thủ SLA hệ thống...).
**Sửa:** 3 DashboardPage → `title={OVERVIEW_PANELS.admin.alerts7d}`...

### 2b. Sidebar sections — `src/shared/utils/sidebarSections.ts`
`AppLayout` hardcode 8 `title: "..."` cho nhóm menu trong `NavSection[]`. Gom thành 1 constant.
```ts
export const SIDEBAR_SECTIONS = {
  admin:   { infrastructure, support, users, system },   // Hạ tầng pin / Hỗ trợ / Người dùng / Hệ thống
  manager: { management, system },                        // Quản lý / Hệ thống
  staff:   { reports, system },                           // Báo cáo / Hệ thống
} as const;
```
**Sửa:** `AppLayout.tsx` → `title: SIDEBAR_SECTIONS.admin.infrastructure`... (8 chỗ; "Hệ thống" xuất hiện 3 lần → sửa theo từng role, không dùng 1 replace chung).

> Cả 2 đặt ở `shared/utils` (không phải feature) vì dùng chung, 1 nguồn cho title. Đổi tên chỉ sửa 1 chỗ.

## Ngoài scope
- Không đổi nội dung/logic component, chỉ đổi vị trí + import path.
- Không đụng các folder domain đã có (alerts/iot/environmental/analytics/layout/ambient/notification-preferences/device-tokens/file).
