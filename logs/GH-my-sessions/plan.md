# Plan — My Sessions (Settings → Security)

## Metadata
- **Status:** DONE | **Role:** FE | **Ngày:** 2026-08-29
- **Nguồn:** QA_Write_Flows_solars.io.vn_2026-08-28.docx — lỗi #49 (Trung bình · Frontend)
- **Issue:** chưa tạo — chạy `/kltn-task` nếu cần số GH

## Mục tiêu
Người dùng xem được mình đang đăng nhập ở những thiết bị nào và tự đăng xuất
thiết bị lạ. Hiện chỉ Admin thu hồi được phiên của người khác — nếu tài khoản
Admin bị chiếm thì không còn ai cứu được. Đổi mật khẩu cũng không đủ vì refresh
token cũ còn hạn 7 ngày.

BE đã xong toàn bộ (`SessionsController`), FE mới khai hằng số URL + type +
query key rồi bỏ dở.

## Scope
**Trong scope:**
- Service + hook + component cho session của CHÍNH MÌNH
- Gắn vào tab Security của AccountSettingsPage
- List phiên · badge "This device" · thu hồi 1 phiên · thu hồi tất cả

**Ngoài scope:**
- Không đụng luồng Admin xem session người khác (đã chạy đúng)
- Không sửa lỗi #27 (BE ghi IP nội bộ 10.42.0.8) — cần fix ForwardedHeaders ở BE
- Không làm `activeOnly=false` (lịch sử phiên) — chỉ hiện phiên đang hoạt động

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/auth/services/session/session.service.ts` | create | 3 hàm gọi ENDPOINTS.SESSIONS.* |
| `src/features/auth/hooks/session/useMySessions.ts` | create | useQuery |
| `src/features/auth/hooks/session/useRevokeSession.ts` | create | useMutation — 1 phiên |
| `src/features/auth/hooks/session/useRevokeAllSessions.ts` | create | useMutation — tất cả |
| `src/features/auth/components/session/MySessionsSection.tsx` | create | UI, chép khuôn TrustedDevicesSection |
| `src/features/auth/pages/AccountSettingsPage.tsx` | modify | thêm 1 SecurityRow |

## Enums
| Enum | File nguồn |
|------|-----------|
| RefreshTokenStatus | shared/enums/account/account.enum.ts (đã có) |

## Types
`SessionDto` đã có sẵn ở `shared/types/account/session.types.ts` — comment trong
file còn trỏ thẳng tới `GET /api/sessions/me`. KHÔNG tạo type mới.

Chỉ thêm payload cho revoke-all:
```ts
interface RevokeAllSessionsPayload {
  exceptCurrent: boolean;
  currentRefreshToken?: string;
}
```

## Endpoints
| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/sessions/me?activeOnly=true` | — | `CommonResponse<SessionDto[]>` |
| DELETE | `/api/sessions/{id}` | — | `CommonResponse<...>` |
| POST | `/api/sessions/revoke-all` | `{ exceptCurrent, currentRefreshToken }` | `CommonResponse<number>` (số phiên đã thu hồi) |

Cả 3 đã khai sẵn ở `shared/utils/endpoints.ts:539-543`.

## Workflow
**Xem danh sách:**
  useMySessions() → GET /me?activeOnly=true
  → render list, phiên có isCurrent=true gắn badge "This device"

**Thu hồi 1 phiên:**
  Bấm nút xoá → DELETE /sessions/{id}
  → OK: invalidate [KEY.sessions] + toast
  → FAIL: handleErrorApi({ error }) → toast

**Thu hồi tất cả:**
  Bấm "Sign out everywhere" → AlertDialog xác nhận
  → POST /revoke-all { exceptCurrent: true, currentRefreshToken: Cookies.get("refreshToken") }
  → giữ nguyên phiên hiện tại, người dùng KHÔNG bị đá ra
  → OK: invalidate + toast kèm số phiên đã thu hồi

## Quyết định thiết kế cần lưu ý
1. **exceptCurrent = true** — không tự đăng xuất chính mình. BE cần
   `currentRefreshToken` để biết phiên nào là hiện tại (refresh token là chuỗi
   ngẫu nhiên, không nằm trong access token).
2. **Không hiện IP nổi bật** — lỗi #27 làm mọi phiên đều ghi 10.42.0.8. Hiển thị
   userAgent làm thông tin chính, IP để phụ, tránh gây hiểu nhầm là thiết bị lạ.
3. Không dùng `deviceId` filter — tham số đó dành cho luồng khác.

## Steps
- [x] B1: service (payload inline trong service, không cần type file riêng)
- [x] B2: 3 hooks
- [x] B3: component MySessionsSection
- [x] B4: gắn vào AccountSettingsPage (tab Security, dưới Trusted devices)
- [x] B5: tsc 0 lỗi · eslint 0 warning · build PASS · 170/170 test PASS

## Phát sinh ngoài plan
- `shared/utils/userAgent.ts` (mới): `parseUserAgent` vốn nằm trong
  `admin/pages/AuditLogsPage.tsx`. Feature auth không import được từ feature admin
  (ESLint no-restricted-imports), nên chuyển ra shared theo đúng rule
  "shared/ là nơi DUY NHẤT chứa code reuse cross-feature". AuditLogsPage nay
  import từ shared thay vì giữ bản sao.
- `shared/schemas/common.schema.ts`: sửa lỗi type trong `requiredSelect`/
  `requiredNumber` (type predicate + `.pipe()` không typecheck với Zod v4).
  Đây là lỗi CÓ SẴN làm `npm run build` fail trước khi bắt đầu task này —
  build đang hỏng thì không xác minh được task, nên phải sửa. Runtime không đổi.
