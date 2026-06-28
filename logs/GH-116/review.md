## BÁO CÁO CODE REVIEW — feat/GH-116-battery-monitoring-extras — 2026-06-28

### TÓM TẮT
GH-116 đợt này = **3a Cascade Risk + 3b Audit Logs** (3c defer chờ GH-114). 28 file, +1157 dòng, thuần GH-116 (đã tách GH-113 IoT ra stash). Code bám pattern repo (service → TanStack Query hook → component), type/enum dùng chung đặt đúng `shared/`. Không có Critical. `tsc --noEmit` ✅ · `eslint . --max-warnings=0` ✅ (0 warning) · `npm run build` ✅.

### PHÂN TÍCH

**Architecture**
- ✅ Không có business logic trong component — chỉ UI + state. API đều qua `services/` → hook (`cascade.service`, `battery-audit-logs.service` → `useCascadeRisk`/`useSiteCascadeSummary`/`useSetTopology`/`useBatteryAuditLogs`/`useAlertAuditLogs`).
- ✅ File placement đúng: enum/type cross-feature (`cascade.enum`, `audit.enum`, `cascade.types`) + presentational `CascadeRiskSummary` đặt `shared/` (dùng admin+manager); action code battery-specific ở `admin/enums`.
- ✅ **Không cross-feature import** (admin↔manager): manager dùng `features/manager/services|hooks` riêng; `CascadeRiskSummary` ở `shared/`. ESLint `no-restricted-imports` pass 0 warning.
- ✅ Không tạo Axios instance mới — dùng `shared/lib/axios`. Zustand không dùng cho server state.

**Code Quality**
- ✅ Component PascalCase; không hardcode URL (qua `ENDPOINTS`); không `console.log`.
- ✅ Loading + empty state đầy đủ: `CascadeRiskCard`/`CascadeRiskSummary`/`BatteryAuditLogTable` đều có Skeleton + empty.

**Error Handling**
- ✅ `queryKey` dùng `QUERY_KEY` factory (`batteryAssets.cascadeRisk`, `sites.cascadeSummary`, `admin.batteryAuditLogs.list`, `admin.alertAuditLogs.list`) — không inline array.
- ✅ `useSetTopology` invalidate qua `QUERY_KEY.batteryAssets.cascadeRisk(assetId)`; **form-driven → không đặt onError** (đúng pattern; `SetTopologyDialog` xử lý `try-catch` + `handleErrorApi({ error, setError })`).
- ✅ Không tự `toast.error` trong hook.

**UI/UX**
- ✅ Primitive đều từ `components/ui` (Card, Badge, Button, Skeleton, Table, Tabs, Select, Dialog, Input, Label) — không custom lại.
- ✅ Filter bar responsive (`lg:` breakpoints); enum bất đối xứng xử lý đúng (POST topology gửi `Number()` int 1..4; DTO `level`/`electricalTopology` là string-name).

**Auth & Security**
- ✅ Route `/admin/battery-audit-logs` khai báo trong `router/index.tsx`, nằm dưới `ProtectedRoute > RoleRoute([ADMIN]) > AppLayout`. Sidebar nav thêm "Audit Pin & Cảnh báo".
- ✅ Cascade card + topology dialog mount ở admin Asset detail (admin-gated); cascade summary ở Site detail (admin+manager). Token không đụng localStorage.

🟡 **Warning** — `AuditLogFilterBar` chưa validate `from ≤ to` phía client (plan §Edge Cases có nhắc). Hiện nếu `from > to` → BE trả 422 → `useQuery` error → bảng hiện empty (không toast). Degradation graceful nhưng thiếu feedback. Không block; có thể bổ sung guard sau.

🟡 **Warning** — `useBatteryAuditLogs`/`useAlertAuditLogs` (useQuery) không surface lỗi (403/422) ra toast — nhất quán với `useAdminAuditLogs` hiện có (list query không toast). Chấp nhận được.

🟡 **Note** — `useSiteCascadeSummary` trùng code ở admin + manager: **cố ý** theo pattern repo (service/hook duplicate per-feature, vd `site.service`); type/enum dùng chung đã ở `shared/`. Không phải lỗi.

🟡 **Note** — Nút "Set topology" (`CascadeRiskCard`) hiển thị vô điều kiện: card chỉ mount ở admin RoleRoute nên đã admin-gated; không cần `checkRole` thêm. An toàn.

### RỦI RO & LƯU Ý
- **3c defer**: live telemetry (SSE) chưa làm — chờ GH-114 merge. Đã ghi rõ trong plan + issue. Không thuộc đợt review này.
- **GH-113 đang ở `stash@{0}`** (kèm bản trộn 4 file infra): khi resume GH-113 cần `stash pop` + dọn vài dòng GH-116 lẫn vào infra. Không mất code.
- Backend cascade/audit/stream cần chạy thật để verify runtime (review này chỉ tĩnh: type + pattern + build).

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**. Không Critical; 2 Warning nhỏ (from/to validation, query error surface) không chặn ship. Tiếp theo: `/kltn-test 116`.
