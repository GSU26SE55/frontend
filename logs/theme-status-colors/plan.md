# Plan — Theme: gom màu-theo-status vào `shared/theme/`

## Metadata
- **Status:** PLANNING | **Role:** FE | **Ngày:** 2026-07-11
- **Issue:** (task nội bộ, chưa có GH number)
- **Scope đã chọn:** Theme + refactor toàn bộ badge/list (phạm vi lớn nhất)

## Mục tiêu
Gom mọi "màu theo trạng thái/enum/severity/priority/SLA" đang hardcode rải rác (shadcn variant / hex GitHub / `bg-emerald-*`...) về **một nguồn duy nhất** quanh CSS token semantic đã có trong `index.css` (`--ok/--p1/--p2/--p3/--info` + `-soft`, đã có bản dark). Kết quả: 1 chỗ đổi màu → toàn app đổi theo, tự động đúng dark mode, hết copy-paste lệch nhau giữa admin/manager/staff.

## Scope
**Trong scope:**
- Tạo folder `src/shared/theme/` (map enum → token + helper class).
- Bổ sung token còn thiếu vào `index.css`: SLA state, diff add/del, cascade level, kb-status dot, trend, telemetry — dùng lại `--ok/--p1/--p3/--info` khi map được, chỉ thêm mới khi thật cần (diff).
- Expose token status cho Tailwind qua `@theme inline` → dùng được class `bg-p1-soft text-p1`... thay inline style.
- Refactor các điểm hardcode "màu theo status" về theme (danh sách Files bên dưới).

**Ngoài scope:**
- Màu trang trí thuần: toàn bộ `features/landing/*`, `features/auth/*` (form/gradient/logo Google), audit/account accent trang trí ở admin. KHÔNG đụng.
- Không gộp/di chuyển enum (vd `WarrantyStatusEnum` dup 3 nơi) — việc khác, tránh scope creep.
- Không đổi logic nghiệp vụ, chỉ đổi cách lấy màu.

## Token bổ sung (`index.css` — thêm ở `:root` L45-55 và `.dark` L101-110, và `@theme inline` L120)

| Token | Light | Dark | Map lại token cũ? |
|------|-------|------|-------------------|
| `--sla-ok` | = `--ok` | = `--ok` | ♻️ dùng lại |
| `--sla-caution` | = `--p3` | = `--p3` | ♻️ dùng lại |
| `--sla-warning` | = `--p1` | = `--p1` | ♻️ dùng lại |
| `--diff-add` / `--diff-add-soft` | `#116329` / `#e6ffec` | `#4ade80` / `rgb(...16%)` | ➕ mới (hệ GitHub) |
| `--diff-del` / `--diff-del-soft` | `#cf222e` / `#ffebe9` | `#f87171` / `rgb(...16%)` | ➕ mới |

`@theme inline`: thêm `--color-ok/--color-ok-soft/--color-p1.../--color-info...` → sinh utility `bg-ok-soft`, `text-p1`, `border-p2`...

## Files

### A. Tạo mới — `shared/theme/`
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/theme/statusColors.ts` | create | Map từng enum → `{ fg, bg, border }` (var token) + helper trả className. Gom: TicketPriority, CascadeRiskLevel, KbArticleStatus (dot), SLA state, TrendDir, TicketHealth, LiveTelemetry stream/threshold, ticketActivity |
| `src/shared/theme/diffColors.ts` | create | Bảng màu diff GitHub → token `--diff-*` (cho KbDiffViewer) |
| `src/shared/theme/index.ts` | create | Re-export |

### B. Token — `index.css`
| File | Action | Ghi chú |
|------|--------|---------|
| `src/index.css` | modify | Thêm token SLA/diff + đưa token status vào `@theme inline` |

### C+ . Bổ sung sau khi scan lại toàn bộ (202 match, đã lọc form-validation)
Các file STATUS thật **plan cũ bỏ sót** — thêm vào scope:
| File | Đổi gì |
|------|--------|
| `src/features/admin/pages/AccountsPage.tsx` (`STATUS_MAP` L68) | AccountStatusEnum → token (Pending→p3, Active→ok, Locked/Banned/Suspended→p1, Inactive→muted). `ROLE_CLS` L95 = màu role — NGOÀI 5 token semantic, giữ nguyên. |
| `src/features/admin/components/AccountDetailDrawer.tsx` (L44-51) | RefreshTokenStatus (Active→ok, Revoked/Compromised→p1) |
| `src/features/admin/pages/AuditLogsPage.tsx` (L163-167, success/fail L275) | audit category + success/fail → token. Category (auth/session/security) không thuộc 5 token → dùng info/p3/p2 gần nghĩa. |
| `src/features/admin/components/BatteryAuditLogTable.tsx` (L20-23, L195) | severity Info/Warning/Critical/Security — **giống AlertSeverity**, tái dùng cùng map |
| `src/shared/components/common/SiteDashboardCard.tsx` (L5-7) | health score ≥80→ok, ≥50→p3, else p1 |
| `src/shared/components/device-tokens/DeviceTokensSection.tsx` (L132) | "current device" badge → ok |
| `src/features/admin/components/sms-gateway/SmsDeviceTable.tsx` (L36) | active badge → ok |
| `src/features/staff|manager/components/TicketKbReferencesPanel.tsx` | kb-ref accent + "manual" tag → token (2 file dup) |

**RANH GIỚI — KHÔNG gom (đã kiểm chứng từng file):**
- `text-red-500` cho `*` bắt buộc + `errors.xxx.message` ở MỌI Dialog/Form/Section (Create/Edit/Invite/Merge Account, CreateNotificationForm, NotificationPreferences, DeviceTokens form...) = màu form-validation chuẩn, KHÔNG phải status.
- Icon trang trí: `AmbientConfigView` (nhiệt/ẩm/nắng), `DashboardPage` CheckCircle emerald.
- Màu `ROLE_CLS` / role badge (purple/blue/teal) — không thuộc hệ 5-token semantic.

### C. Refactor điểm hardcode (đọc từ theme)
| File | Action | Đổi gì |
|------|--------|--------|
| `src/shared/lib/sla.ts` | modify | `slaBarColorClass` → trả class token (`bg-ok/bg-p3/bg-p1` hoặc từ theme) |
| `src/shared/components/common/kb/KbDiffViewer.tsx` | modify | Hex `#ffebe9/#e6ffec...` → token `--diff-*` |
| `src/shared/components/common/CascadeRiskSummary.tsx` | modify | `LEVEL_STYLE` → import từ theme |
| `src/features/admin/components/CascadeRiskCard.tsx` | modify | `LEVEL_STYLE` (dup) → import từ theme |
| `src/features/admin/pages/KbListPage.tsx` | modify | `STATUS_DOT` → theme |
| `src/features/manager/pages/KbListPage.tsx` | modify | `STATUS_DOT` (dup) → theme |
| `src/features/manager/components/SlaCountdown.tsx` | modify | `bg-green/red/yellow-100` → token |
| `src/features/staff/components/SlaCountdown.tsx` | modify | `bg-green-*` → token (thống nhất với manager) |
| `src/shared/components/common/TicketHealthCard.tsx` → `admin/components/TicketHealthCard.tsx` | modify | health level → token |
| `src/shared/components/common/LiveTelemetryCard.tsx` | modify | stream status + threshold → theme |
| `src/shared/components/common/KpiCard.tsx` | modify | TrendDir → theme |
| `src/shared/components/common/ticketActivityMeta.tsx` | modify | dot/bg hardcode → theme |
| `src/shared/components/common/kb/KbVisibilityBadge.tsx` | modify | public/internal → theme |

### D. Badge dùng shadcn variant — **QUYẾT ĐỊNH: MỞ RỘNG, chuyển sang token semantic**
Chuyển 8 chỗ sau từ shadcn `variant` (chỉ 4 màu, "Escalated"="Incident"=đỏ) sang **token semantic** (`ok/info/p3/p2/p1/muted`) để phân biệt đúng trạng thái. Mỗi enum map trong `shared/theme/statusColors.ts`; badge đọc `{ fg, bg, border }` render qua inline style (giống mẫu `TicketPriorityBadge` đã đúng).

| File | Enum |
|------|------|
| `src/shared/components/common/TicketStatusBadge.tsx` | TicketStatusEnum (14 giá trị) |
| `src/shared/components/alerts/AlertStatusBadge.tsx` | AlertStatusEnum |
| `src/shared/components/alerts/AlertSeverityBadge.tsx` | AlertSeverityEnum |
| `src/shared/components/common/kb/KbStatusBadge.tsx` | KbArticleStatusEnum |
| `src/shared/components/environmental/IncidentStatusBadge.tsx` | EnvironmentalIncidentStatusEnum |
| `src/shared/components/iot/IoTDeviceStatusBadge.tsx` | IotDeviceStatusEnum |
| `src/features/admin/components/BatteryAssetTable.tsx` (`statusVariant` L36) | BatteryStatusEnum |
| `src/features/staff/pages/AlertsPage.tsx` (`getStatusVariant` L44) | NotificationStatusEnum |

Giữ pattern fallback `?? muted` khi enum ngoài map (không để badge trống). Bảng map enum→nhóm màu chi tiết: xem `plan-color-map.md` (tạo từ khảo sát enum).

## Điểm cần thống nhất khi gom (đã chốt)
- **2 bản SlaCountdown**: ✅ **thống nhất theo bản MANAGER** — state Met→ok, Breached→p1, Paused→p3, Warning→p1, còn lại→muted, map sang token `--sla-*`. Staff đổi theo manager.
- **Badge**: ✅ **mở rộng** — chuyển hết sang token semantic (nhóm D ở trên).
- **Fallback an toàn**: giữ pattern `?? muted` khi enum ngoài map — không để badge trống.

## Workflow (data flow)
```
Component cần màu status
  → import { getXxxColor } / XXX_COLOR từ @/shared/theme
  → nhận { fg, bg, border } (var token) hoặc className
  → render (inline style hoặc class bg-*-soft)
  → token tự resolve light/dark qua :root / .dark trong index.css
```

## Steps
- [ ] B1: Thêm token SLA/diff vào `index.css` + đưa status token vào `@theme inline`
- [ ] B2: Tạo `shared/theme/statusColors.ts` + `diffColors.ts` + `index.ts`
- [ ] B3: Refactor `sla.ts` + 2 `SlaCountdown` (thống nhất màu)
- [ ] B4: Refactor CascadeRisk (2 file dup) + KbListPage dot (2 file dup)
- [ ] B5: Refactor KbDiffViewer (hex → diff token)
- [ ] B6: Refactor TicketHealthCard / LiveTelemetryCard / KpiCard / ticketActivityMeta / KbVisibilityBadge
- [ ] B7: `tsc --noEmit` + `eslint --max-warnings=0` → PASS
- [ ] B8: Verify mắt thường 3 portal (admin/manager/staff) light + dark — màu status hiển thị đúng, không mất chữ/nền
```
