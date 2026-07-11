# Plan — Gom nav config sidebar: chung → shared, đặc thù → feature

## Metadata
- **Role:** FE | **Ngày:** 2026-07-11 | Task nội bộ (không GH number)
- **Scope:** `AppLayout.tsx` (3 nav config hardcode) + router + 3 feature config mới + shared labels

## Mục tiêu
`AppLayout.tsx` (ở `shared/`) đang hardcode toàn bộ `ADMIN_NAV` / `MANAGER_NAV` / `STAFF_NAV`
(~39 label + 8 title section + path + icon). Điều này khiến tầng `shared` biết chi tiết đặc thù
của từng feature — sai nguyên tắc "shared là tầng nền, không phụ thuộc ngược features".

Gom lại theo đúng rule kiến trúc:
- **Chung (≥2 role dùng)** → `shared/`
- **Đặc thù (1 role dùng)** → `features/{role}/`
- **KHÔNG để `shared/` import `features/`** — router (ngoài shared) là nơi ráp nav theo role.

## Scope
**Trong scope:**
- Tách nav config theo role ra `features/{role}/config/`
- Rút label/title dùng chung + `appName` ra `shared/utils/`
- `AppLayout` bỏ hardcode → nhận `sections` qua prop
- Router truyền nav tương ứng cho mỗi route group

**Ngoài scope:**
- Không đổi UI/behavior sidebar (label hiển thị, thứ tự, icon, active-state giữ nguyên)
- Không đụng `Sidebar.tsx` (đã nhận props chuẩn rồi)
- Không đụng `overviewPanels.ts` / `sidebarSections.ts` đã tạo ở task trước (xem bên dưới)

## Quan hệ với file đã tạo trước đó
- `shared/utils/overviewPanels.ts` — **giữ nguyên** (panel trong trang Tổng quan, khác việc này).
- `shared/utils/sidebarSections.ts` — task này **thay thế/mở rộng** nó. Title section chung
  (chỉ "Hệ thống" trùng cả 3 role) sẽ gộp vào `sidebarLabels.ts`. Title section đặc thù
  ("Hạ tầng pin"/"Hỗ trợ"/"Người dùng"→admin, "Quản lý"→manager, "Báo cáo"→staff) chuyển về
  feature. → sau khi xong sẽ **xóa `sidebarSections.ts`** (bị thay thế).

## Phân loại label/title (đối chiếu 3 role)

### Chung → `shared/utils/sidebarLabels.ts` (dùng ≥2 role)
| Key | Giá trị | Role dùng |
|-----|---------|-----------|
| overview | "Tổng quan" | admin, manager, staff |
| analytics | "Analytics" | admin, manager |
| sites | "Sites" | admin, manager |
| tickets | "Tickets" | admin, manager |
| knowledgeBase | "Knowledge Base" | admin, manager, staff |
| batteryAlerts | "Cảnh báo pin" | admin, manager, staff |
| envIncidents | "Sự cố môi trường" | admin, manager, staff |
| ambient | "Môi trường site" | admin, manager |
| settings | "Cài đặt" | admin, manager, staff |
| **title** systemSection | "Hệ thống" | admin, manager, staff |
| **appName** | "Solar Battery Management" | (Sidebar) |

> Shape đề xuất: `SIDEBAR_LABELS` (label chung) + `SIDEBAR_SECTION_TITLES.system` + `APP_NAME`.
> Tất cả `as const`.

### Đặc thù → `features/{role}/config/{role}Nav.ts`

**admin** — label riêng: Battery Assets, Loại pin & Ngưỡng, IoT Devices, Firmware OTA,
Tài khoản, Vai trò & Quyền hạn, SMS Gateway, Saga Debug, Audit Logs, Audit Pin & Cảnh báo,
Audit Truy cập File, Gửi thông báo. Title section riêng: "Hạ tầng pin", "Hỗ trợ", "Người dùng".

**manager** — label riêng: Hàng chờ, Calibration sắp hết hạn. Title section riêng: "Quản lý".

**staff** — label riêng: My Tickets, Lịch sử bảo trì, SLA Monitor, Calibration thiết bị,
Alerts. Title section riêng: "Báo cáo".

> Mỗi `{role}Nav.ts` export `const {ROLE}_NAV: NavSection[]`, import:
> - label/title chung từ `@/shared/utils/sidebarLabels`
> - `NavSection` type từ `@/shared/components/layout/Sidebar`
> - icon từ `lucide-react`
> Đây là feature import shared — hợp lệ.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/sidebarLabels.ts` | create | Label/title chung ≥2 role + APP_NAME |
| `src/features/admin/config/adminNav.ts` | create | `ADMIN_NAV: NavSection[]` |
| `src/features/manager/config/managerNav.ts` | create | `MANAGER_NAV` |
| `src/features/staff/config/staffNav.ts` | create | `STAFF_NAV` |
| `src/shared/components/layout/AppLayout.tsx` | modify | Bỏ 3 const NAV + icon imports; nhận `sections?` + `appName?` qua prop; giữ fallback chọn-theo-role cho route `/settings` (mọi role) |
| `src/router/index.tsx` | modify | Truyền nav vào 3 group: `<AppLayout sections={ADMIN_NAV}/>` … |
| `src/shared/utils/sidebarSections.ts` | delete | Bị thay thế bởi sidebarLabels + {role}Nav |

## Approach — luồng "config-down, không import-up"

```
features/admin/config/adminNav.ts   ──imports──▶  shared/utils/sidebarLabels (chung)
features/manager/config/managerNav.ts             shared/components/layout/Sidebar (type NavSection)
features/staff/config/staffNav.ts

router/index.tsx (ngoài shared, được import mọi feature)
   │  <AppLayout sections={ADMIN_NAV}   appName={APP_NAME} />   (group /admin)
   │  <AppLayout sections={MANAGER_NAV} appName={APP_NAME} />   (group /manager)
   │  <AppLayout sections={STAFF_NAV}   appName={APP_NAME} />   (group /staff)
   │  <AppLayout />                                             (route /settings — mọi role)
   ▼
shared/components/layout/AppLayout.tsx
   props.sections ?? (chọn theo useSessionStore().role)   ← fallback cho /settings
   │
   ▼
<Sidebar sections={sections} appName={appName} />   (đã nhận props sẵn)
```

**Điểm mấu chốt — route `/settings` (dòng 118-120 router):** dùng `<AppLayout/>` cho MỌI role,
không gắn role cụ thể. Nên AppLayout phải giữ khả năng **tự chọn nav theo role runtime** khi
prop `sections` không được truyền. → `AppLayout` vẫn cần map `role → NAV`, nhưng map này đặt ở
**router-adjacent** (hoặc chính AppLayout nhận qua prop). Xem "Điểm cần quyết".

## Điểm cần quyết
- **Route `/settings` (mọi role):** AppLayout cần biết nav theo role runtime.
  - **(A) Mặc định — đề xuất:** giữ 1 map `roleToNav` NGAY TRONG router, `/settings` cũng truyền
    `sections` bằng cách bọc: nhưng `/settings` không biết role tại config-time → cần 1 wrapper nhỏ
    `<RoleAwareAppLayout/>` đặt ở router đọc `useSessionStore().role` rồi chọn NAV. Wrapper này ở
    `router/` (ngoài shared) → được phép import cả 3 feature. `AppLayout` thành pure (chỉ nhận props).
  - **(B) Đơn giản hơn:** cho `AppLayout` nhận optional `sections`; nếu thiếu thì import 3 NAV +
    chọn theo role. NHƯNG như vậy `shared/AppLayout` lại import `features/*` → **phá rule**. ❌
  - → Chọn **(A)**: AppLayout pure, wrapper chọn-role nằm ở router.

## Steps
- [x] B1: Tạo `shared/utils/sidebarLabels.ts` (label chung + section title chung + APP_NAME)
- [x] B2: Tạo 3 `features/{role}/config/{role}Nav.ts` — copy nav hiện tại, thay label/title chung
      bằng ref hằng số, giữ label/title đặc thù inline
- [x] B3: Sửa `AppLayout.tsx` → pure component nhận `sections` prop (dùng APP_NAME cho appName),
      bỏ hardcode 3 NAV + icon imports thừa
- [x] B4: Tạo wrapper `router/RoleAwareAppLayout.tsx` (chọn NAV theo role) — dùng cho `/settings`
- [x] B5: Sửa `router/index.tsx` — 3 group role truyền `sections` trực tiếp; `/settings` dùng wrapper
- [x] B6: Xóa `sidebarSections.ts`
- [x] B7: `tsc --noEmit` ✅ + `eslint --max-warnings=0` ✅ + `npm run build` ✅ PASS.
      Không thêm import `shared→features` mới (chỉ preexisting `useLogout` trong AppLayout).

## Kết quả
- Nav đặc thù từng role đã ra `features/{role}/config/` — tầng shared không còn biết chi tiết feature.
- Label/title chung ≥2 role + APP_NAME gom về `shared/utils/sidebarLabels.ts`.
- `AppLayout` pure (nhận `sections` qua prop); router ráp nav theo role (config-down).
- Rule "shared không import features" giữ nguyên — wrapper chọn-role nằm ở `router/` (ngoài shared).
```
