## BÁO CÁO CODE REVIEW — feat/GH-90-sms-gateway-admin — 2026-06-20
### Scope: FE (Web)
### Effort: Standard

### TÓM TẮT
Feature quản lý SMS Gateway (admin) — 8 file mới + 4 file sửa surgical. Code khớp pattern codebase (`useAdminAccounts`, `BatteryTypesPage`), đúng plan đã verify với BE. Không có Critical. Một số Warning minor không chặn ship.

### PHÂN TÍCH

#### ✅ Pass
- **Architecture:** Component chỉ UI + state; mọi API qua `adminSmsGatewayService` → hook TanStack Query. Không fetch trực tiếp trong component.
- **Feature isolation:** Files đặt trong `features/admin/` (SMS gateway là admin-only). Import chỉ từ `@/features/admin/*`, `@/shared/*`, `@/components/ui/*` — KHÔNG cross-feature (manager/staff/auth).
- **Axios:** Dùng `shared/lib/axios.ts`, không tạo instance mới. Không hardcode URL — qua `ENDPOINTS.ADMIN.SMS_GATEWAY`.
- **Query keys:** `useAdminSmsDevices` dùng `QUERY_KEY.admin.smsGateway.list(params)`; invalidate dùng `KEY.admin.smsGateway` (broad). Không inline array.
- **Error handling:**
  - Form create (`CreateSmsDeviceDialog.tsx:60-66`): `try-catch` + `handleErrorApi({ error, setError })` → 400 map field, 409 toast.
  - Revoke mutation (`useAdminSmsGateway.ts:40`): `onError: handleErrorApi({ error })` → toast.
  - Hook không tự `toast.error` (chỉ `toast.success` cho revoke) — delegate đúng.
- **Auth:** Route `/admin/sms-gateway` (`router/index.tsx:139`) nằm trong nhánh `ProtectedRoute > RoleRoute([UserRole.ADMIN]) > AppLayout` — kế thừa auth + role gate. BE cũng `[Authorize(Roles="Admin")]`.
- **UI:** Toàn shadcn (`Dialog`, `AlertDialog`, `Table`, `Badge`, `Card`, `Checkbox`, `Skeleton`, `Input`, `Button`); loading skeleton + empty state. Không custom primitive.
- **apiKey security:** Hiển thị 1 lần trong modal readOnly, có cảnh báo + copy fallback (`textarea`/`execCommand` cho non-secure context). Không log key.
- **Naming:** PascalCase component, `use*` hook, `*.service.ts`, `*.schema.ts`, `*.types.ts` đúng convention.
- **Build gate:** `tsc --noEmit` ✅ · `eslint --max-warnings=0` ✅ · `npm run build` ✅.

#### 🟡 Warning
- `SmsDeviceTable.tsx:18` — Badge "online" tính bằng `Date.now() - lastSeenAt < 10'` tại render-time; không tự đổi sang "offline" cho đến lần re-render/refetch kế tiếp. **Chấp nhận được** theo thiết kế (staleTime 30s + refresh tay, không auto-poll — đúng plan). Gợi ý: nếu muốn chính xác hơn sau này → auto-poll 60s.
- `SmsGatewayPage.tsx:117` — `disabled={revoking}` trên `AlertDialogAction` gần như no-op vì Radix tự đóng dialog ngay khi click (revokeTarget bị clear qua `onOpenChange`); `onSettled: setRevokeTarget(null)` do đó dư thừa nhưng vô hại. Cosmetic.
- `SmsGatewayPage.tsx:88-94` — Query list không xử lý riêng `isError`: khi API lỗi (ngoài 401), `data` undefined → render empty state "Chưa có thiết bị nào" (hơi gây hiểu nhầm là rỗng thật). **Nhất quán với codebase** (`BatteryTypesPage` cũng chỉ handle `isLoading` + empty, không `isError`) — không chặn. Gợi ý có thể thêm error state chung sau.

### RỦI RO & LƯU Ý
- **Phụ thuộc BE:** Cần SmsService chạy + route gateway `/api/admin/sms-gateway/*` reachable qua ApiGateway để test thực. Contract đã verify từ source BE (`AdminGatewayDevicesController.cs`).
- **Manual QA bắt buộc** (luồng apiKey 1 lần không khôi phục): chạy ở `/kltn-test 90` — copy HTTPS/localhost + fallback non-secure + đóng modal mất key + 409 trùng + revoke biến mất.
- **Diff `dev...HEAD` nhiễu:** local `dev` ref stale (lẫn GH-88/89, notification, trusted-device). Review scope đúng vào working-tree changes của GH-90.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
(Không có Critical. 3 Warning đều minor, nhất quán convention codebase, không chặn ship. Manual QA luồng apiKey thực hiện ở bước test.)
