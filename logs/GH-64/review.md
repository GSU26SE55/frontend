# BÁO CÁO CODE REVIEW — feat/GH-64-deferred-ui-profile-invite-admin — 2026-06-06

## TÓM TẮT

Toàn bộ 4 nhóm UI trong scope GH-64 đã được implement đúng pattern, build + lint + type check đều PASS. Có 1 warning ảnh hưởng UX (avatar không hiển thị) và 1 stray file ngoài scope cần loại khỏi commit.

---

## PHÂN TÍCH

### 🟡 Warning 1 — ProfilePage không render avatar thực
**File:** `src/features/auth/pages/ProfilePage.tsx:118`

Avatar card luôn hiển thị initials, không dùng `account.avatarUrl` dù field này có trên `AccountDto`.

```tsx
// Hiện tại: chỉ initials
<div className="w-20 h-20 rounded-full ... bg-emerald-100 text-emerald-700">
  {initials}
</div>

// Nên là:
{account?.avatarUrl ? (
  <img src={`${import.meta.env.VITE_API_BASE_URL}${account.avatarUrl}`}
    className="w-20 h-20 rounded-full object-cover" alt={account.fullName} />
) : (
  <div className="w-20 h-20 rounded-full ... bg-emerald-100 text-emerald-700">{initials}</div>
)}
```

Hệ quả: sau khi `useUpdateAvatar` thành công, avatar mới không hiển thị trên ProfilePage — UX bị gãy đối với user đã upload ảnh.

---

### 🟡 Warning 2 — `logs/GH-36/plan.md` bị modify ngoài scope
**File:** `logs/GH-36/plan.md`

File này có trong `git status` với trạng thái Modified (unstaged) — thay đổi nội dung plan của ticket khác. Không liên quan GH-64. **Không được include vào commit khi `/kltn-ship`.**

---

### 🟡 Warning 3 — AuditLogsPage thiếu pagination thực
**File:** `src/features/admin/pages/AuditLogsPage.tsx:54`

```ts
useAdminAuditLogs({ pageNumber: 1, pageSize: 100 })
```

Plan đề cập pagination pageSize 20, nhưng implementation dùng pageSize 100 + client-side filter. Chấp nhận được cho MVP sprint 1 nhưng sẽ cần pagination thực khi log nhiều.

---

### ✅ Pass — Danh sách tiêu chí đạt

| Tiêu chí | Kết quả |
|----------|---------|
| Không gọi API trực tiếp trong component — qua service → hook | ✅ |
| Form submit: `mutateAsync` + try-catch + `handleErrorApi({ error, setError })` | ✅ |
| Non-form mutation: `onError` + `handleErrorApi({ error })` | ✅ |
| Không dùng `localStorage` cho token | ✅ |
| Không import cross-feature (admin ↔ manager/staff) | ✅ |
| `DialogState` discriminated union cho dialog management | ✅ |
| Type cast `as unknown as { items?: unknown[] }` đúng pattern | ✅ |
| `/invite/accept` đặt dưới `AuthLayout` (public, ngoài ProtectedRoute) | ✅ |
| `useAcceptInvite` mirror đúng `useLogin` flow (saveTokens → decode → CUSTOMER guard → setSession → setQueryData → navigate) | ✅ |
| `useAdminChangeAccountRole` invalidate cả `KEY.admin.accounts` + `QUERY_KEY.admin.accounts.detail(id)` | ✅ |
| `DropdownMenuTrigger` dùng `className` trực tiếp (không có `asChild`) | ✅ |
| Confirmation dialog dùng plain `Dialog` (không dùng AlertDialog chưa install) | ✅ |
| `z.number()` + `valueAsNumber: true` (không dùng `z.coerce.number()`) | ✅ |
| Form object pattern `const form = useForm<T>()` tránh mất generic | ✅ |
| `isSystemRole` guard — ẩn Delete trên RolesPage | ✅ |
| PermissionsDialog: empty confirm bằng nested Dialog (không stack AlertDialog) | ✅ |
| `tsc --noEmit` | ✅ PASS |
| `eslint --max-warnings=0` | ✅ PASS |
| `npm run build` | ✅ built in 2.32s |

---

## RỦI RO & LƯU Ý

- **Warning 1 (avatar)** ảnh hưởng UX trực tiếp — user upload avatar xong quay lại ProfilePage vẫn thấy initials. Nếu không fix trước ship, nên tạo issue follow-up.
- **Warning 2 (stray file)** phải loại khỏi commit — dùng `git checkout logs/GH-36/plan.md` trước khi `/kltn-ship`.
- `AcceptInvitePage` xử lý 410/409 qua `handleErrorApi` toast — message hiển thị phụ thuộc vào BE response. Nếu BE không trả đúng message tiếng Việt, UX sẽ tệ.

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Tất cả critical gate đều xanh. 2 warning kỹ thuật (avatar display, stray file) không block ship nhưng nên xử lý:
1. Fix avatar render trước ship (5 phút) — hoặc tạo follow-up issue
2. Restore `logs/GH-36/plan.md` trước commit — bắt buộc

Sau khi xử lý: chạy `/kltn-test 64`.
