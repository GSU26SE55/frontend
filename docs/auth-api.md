# Auth Service API — Authentication Endpoints

**Base URL:** `http://localhost:4001/auth-service`
**Version:** v1

---

## Mục lục

1. [Đăng ký & OTP](#1-đăng-ký--otp)
2. [Đăng nhập & Token](#2-đăng-nhập--token)
3. [Quên mật khẩu](#3-quên-mật-khẩu)
4. [Invite](#4-invite)
5. [Google OAuth](#5-google-oauth)
6. [Profile (cần auth)](#6-profile-cần-auth)
7. [Schemas](#7-schemas)

---

## 1. Đăng ký & OTP

### POST `/api/auth/register`

Tạo tài khoản mới ở trạng thái `PendingVerification` và gửi OTP qua email.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "Abc@1234",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0901234567",
  "dateOfBirth": "2000-01-15",
  "address": "123 Đường ABC, TP.HCM"
}
```

| Field | Bắt buộc | Ràng buộc |
|-------|----------|-----------|
| `email` | ✅ | max 256 ký tự, đúng định dạng email |
| `password` | ✅ | 8–100 ký tự, có hoa/thường/số/ký tự đặc biệt |
| `fullName` | ✅ | max 150 ký tự |
| `phoneNumber` | ❌ | max 20 ký tự |
| `dateOfBirth` | ❌ | không được là ngày tương lai, năm ≥ 1900 |
| `address` | ❌ | max 500 ký tự |

**Header khuyến nghị:** `Idempotency-Key: <UUID v4>`

**Responses**

| Status | Mô tả |
|--------|-------|
| `201` | Đăng ký thành công, OTP đã gửi qua email |
| `400` | Dữ liệu không hợp lệ |
| `409` | Email/Phone đã tồn tại |
| `429` | Too Many Requests |

**Response 201**
```json
{
  "isSuccess": true,
  "statusCode": 201,
  "message": "...",
  "data": {
    "email": "user@example.com",
    "otpExpiresInSeconds": 300
  },
  "listErrors": null
}
```

---

### POST `/api/auth/verify-otp`

Xác thực OTP để kích hoạt tài khoản. **Không trả token** — sau verify phải gọi `/api/auth/login`.

**Request Body**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `email` | email đã đăng ký |
| `otp` | đúng 6 chữ số |

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Kích hoạt tài khoản thành công |
| `400` | OTP hết hạn / không đúng mục đích / đã dùng |
| `401` | OTP sai (kèm số lần thử còn lại) |
| `404` | Tài khoản không tồn tại |
| `423` | Tài khoản bị khóa do sai OTP quá nhiều lần |

---

### POST `/api/auth/resend-otp`

Gửi lại OTP đăng ký. Chỉ dùng cho tài khoản đang ở trạng thái `PendingVerification`.

**Rate limit:** tối thiểu 60 giây giữa các lần gửi.

**Request Body**
```json
{
  "email": "user@example.com"
}
```

**Header khuyến nghị:** `Idempotency-Key: <UUID v4>`

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đã gửi lại OTP |
| `400` | Tài khoản đã verify hoặc không ở trạng thái PendingVerification |
| `404` | Tài khoản không tồn tại |
| `429` | Gửi lại quá nhanh, cần đợi |

---

## 2. Đăng nhập & Token

### POST `/api/auth/login`

Đăng nhập bằng email và mật khẩu. Trả về cặp `accessToken` + `refreshToken`.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "Abc@1234"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `email` | max 256 ký tự, đúng định dạng |
| `password` | 6–100 ký tự, không chứa khoảng trắng |

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đăng nhập thành công |
| `400` | Dữ liệu đầu vào không hợp lệ |
| `401` | Email hoặc mật khẩu không đúng |
| `403` | Tài khoản bị vô hiệu hóa hoặc chưa xác minh |
| `423` | Tài khoản bị khóa do đăng nhập sai quá nhiều lần |

**Response 200**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "...",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "listErrors": null
}
```

---

### POST `/api/auth/refresh-token`

Làm mới access token bằng refresh token còn hạn. Áp dụng **refresh token rotation** — token cũ bị revoke, token mới được cấp.

> ⚠️ Nếu refresh token đã dùng bị gửi lại, hệ thống có thể revoke toàn bộ session của tài khoản.

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Cấp lại cặp token thành công |
| `401` | Token không hợp lệ / hết hạn / phát hiện reuse |

**Response 200** — cùng shape với Login.

---

### POST `/api/auth/logout`

Đăng xuất một phiên bằng cách revoke refresh token. Access token đã cấp vẫn có thể còn hạn cho đến khi hết hạn (stateless JWT).

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đăng xuất thành công |
| `400` | Thiếu refresh token |

> Để đăng xuất **tất cả thiết bị**, dùng `POST /api/sessions/revoke-all`.

---

## 3. Quên mật khẩu

### POST `/api/auth/forgot-password`

Bước 1 — Gửi OTP reset password qua email.

> ℹ️ Luôn trả `200` dù email không tồn tại (chống dò tài khoản). FE nên hiển thị: *"Nếu email tồn tại, mã xác thực đã được gửi"*.

**Request Body**
```json
{
  "email": "user@example.com"
}
```

**Header khuyến nghị:** `Idempotency-Key: <UUID v4>`

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đã xử lý yêu cầu |
| `429` | Too Many Requests |

---

### POST `/api/auth/verify-reset-otp`

Bước 2 — Xác thực OTP reset password, nhận `resetToken` ngắn hạn.

**Request Body**
```json
{
  "email": "user@example.com",
  "otp": "654321"
}
```

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | OTP hợp lệ, trả về reset token |
| `400` | OTP hết hạn / sai mục đích / đã dùng |
| `401` | OTP sai |
| `404` | Tài khoản không tồn tại |
| `423` | Tài khoản bị khóa |

**Response 200**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": {
    "resetToken": "eyJhbGci...",
    "expiresInSeconds": 300
  }
}
```

---

### POST `/api/auth/reset-password`

Bước 3 — Đặt mật khẩu mới bằng `resetToken` từ bước 2. Tự động revoke toàn bộ session active.

**Request Body**
```json
{
  "resetToken": "eyJhbGci...",
  "newPassword": "NewAbc@5678"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `resetToken` | token nhận từ `/api/auth/verify-reset-otp` |
| `newPassword` | min 8 ký tự, có hoa/thường/số/ký tự đặc biệt |

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đặt lại mật khẩu thành công |
| `400` | Dữ liệu không hợp lệ |
| `401` | Reset token không hợp lệ / hết hạn |
| `404` | Tài khoản không tồn tại |

---

### POST `/api/auth/resend-reset-otp`

Gửi lại OTP reset password. **Rate limit:** 60 giây giữa các lần.

**Request Body**
```json
{
  "email": "user@example.com"
}
```

**Header khuyến nghị:** `Idempotency-Key: <UUID v4>`

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đã gửi lại OTP |
| `400` | Bad Request |
| `429` | Gửi lại quá nhanh |

---

## 4. Invite

### POST `/api/auth/accept-invite`

Dùng cho nhân viên được admin mời vào hệ thống. Đặt mật khẩu lần đầu và tự động đăng nhập (trả token).

**Request Body**
```json
{
  "invitationToken": "eyJhbGci...",
  "password": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `invitationToken` | token nhận từ email invite |
| `password` | min 8 ký tự, có hoa/thường/số/ký tự đặc biệt |
| `confirmPassword` | phải khớp `password` |

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Accept thành công, trả token đăng nhập |
| `400` | Dữ liệu không hợp lệ hoặc account đã active |
| `401` | Invitation token không hợp lệ / hết hạn |

**Response 200** — cùng shape với Login (`accessToken` + `refreshToken`).

---

## 5. Google OAuth

### GET `/api/auth/google/login`

Bước 1 — Redirect người dùng sang trang chọn tài khoản Google.

```js
window.location.href = "/api/auth/google/login"
```

**Responses**

| Status | Mô tả |
|--------|-------|
| `302` | Redirect sang Google OAuth |
| `500` | Thiếu cấu hình redirect URI |

---

### GET `/api/auth/google/callback`

Bước 2 — Google redirect về endpoint này với query params. Trả token đăng nhập.

**Query Parameters**

| Param | Mô tả |
|-------|-------|
| `code` | Authorization code do Google cấp |
| `state` | State chống CSRF (phải khớp cookie `g_oauth_state`) |
| `error` | Lỗi từ Google nếu người dùng hủy |

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Đăng nhập thành công, trả `accessToken` + `refreshToken` |
| `400` | Thiếu `code` hoặc `state` |
| `401` | State mismatch / token exchange fail |
| `403` | Tài khoản bị banned/suspended |
| `409` | Email đã tồn tại ở trạng thái PendingVerification |
| `500` | Cấu hình thiếu |

---

## 6. Profile (cần auth)

> Tất cả endpoint dưới đây yêu cầu header: `Authorization: Bearer <accessToken>`

### GET `/api/auth/me`

Lấy thông tin đầy đủ của tài khoản đang đăng nhập.

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Trả về `AccountDto` |
| `401` | Access token không hợp lệ / hết hạn |

**Response 200**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0901234567",
    "dateOfBirth": "2000-01-15",
    "address": "123 Đường ABC",
    "emailConfirmed": true,
    "phoneConfirmed": false,
    "twoFactorEnabled": false,
    "status": "Active",
    "lastLoginAt": "2026-05-14T10:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z",
    "roles": ["Customer"],
    "profile": {},
    "staffProfile": null,
    "displayAvatarUrl": "https://..."
  }
}
```

**Quy tắc resolve `displayAvatarUrl`:**
1. Avatar upload qua FileStorageService (ưu tiên)
2. Google picture (`ExternalAvatarUrl`)
3. `null` → FE hiển thị placeholder

---

### PUT `/api/auth/me/profile`

Cập nhật thông tin cá nhân. Không cho phép đổi email, mật khẩu, role hoặc trạng thái.

**Request Body**
```json
{
  "fullName": "Nguyen Van B",
  "phoneNumber": "0909999999",
  "address": "456 Đường XYZ",
  "birthDate": "1999-05-20",
  "timeZone": "Asia/Ho_Chi_Minh"
}
```

| Field | Bắt buộc | Ràng buộc |
|-------|----------|-----------|
| `fullName` | ✅ | max 150 ký tự |
| `phoneNumber` | ❌ | max 20 ký tự |
| `address` | ❌ | max 500 ký tự |
| `birthDate` | ❌ | không tương lai, năm ≥ 1900 |
| `timeZone` | ❌ | max 100 ký tự, VD: `Asia/Ho_Chi_Minh` |

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Cập nhật thành công, trả lại `AccountDto` |
| `400` | Dữ liệu không hợp lệ |
| `401` | Access token không hợp lệ |
| `404` | Tài khoản không tồn tại |
| `409` | Số điện thoại bị trùng |

---

### POST `/api/auth/me/avatar`

Gắn avatar cho tài khoản. Đây là bước 2 sau khi đã upload file lên FileStorageService.

**Flow:**
1. Upload ảnh → `POST /api/files/upload` (FileStorageService) → nhận `fileId`
2. Gọi endpoint này với `fileId` vừa nhận

**Request Body**
```json
{
  "avatarFileId": "uuid-of-uploaded-file"
}
```

**Responses**

| Status | Mô tả |
|--------|-------|
| `200` | Gắn avatar thành công, trả lại `AccountDto` |
| `400` | Thiếu hoặc `avatarFileId` không hợp lệ |
| `401` | Access token không hợp lệ |
| `404` | Tài khoản không tồn tại |

---

## 7. Schemas

### TokenDTO (data của LoginResponse)
```typescript
{
  accessToken: string
  refreshToken: string
}
```

### RegisterResponseData
```typescript
{
  email: string
  otpExpiresInSeconds: number
}
```

### ResetTokenDto
```typescript
{
  resetToken: string
  expiresInSeconds: number
}
```

### AccountDto
```typescript
{
  id: string
  email: string
  phoneNumber: string | null
  fullName: string
  avatarUrl: string | null
  dateOfBirth: string | null
  address: string | null
  emailConfirmed: boolean
  phoneConfirmed: boolean
  twoFactorEnabled: boolean
  status: AccountStatusEnum
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  roles: string[]
  profile: AccountProfileDto | null
  staffProfile: StaffProfileDto | null
  displayAvatarUrl: string | null
}
```

### CommonResponse wrapper (dùng cho phần lớn endpoint)
```typescript
{
  isSuccess: boolean
  statusCode: number
  message: string | null
  data: T | null
  listErrors: ValidationError[] | null
}
```

### ValidationError (phần tử trong `listErrors`)
```typescript
{
  field: string   // tên field bị lỗi (PascalCase, khớp với tên property trong request)
  detail: string  // mô tả lỗi cụ thể
}
```

**Ví dụ response 400 — lỗi validate đầu vào:**
```json
{
  "isSuccess": false,
  "statusCode": 400,
  "message": "Dữ liệu đầu vào không hợp lệ.",
  "data": null,
  "listErrors": [
    {
      "field": "Email",
      "detail": "Email không đúng định dạng."
    },
    {
      "field": "Password",
      "detail": "Mật khẩu phải tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
    }
  ]
}
```

> Khi `isSuccess = false` và `listErrors` có phần tử → lỗi **validate field** (map về từng field trong form).
> Khi `isSuccess = false` và `listErrors` rỗng/null → lỗi **business logic** (hiển thị `message` dạng toast).

---

## Tóm tắt luồng

```
Đăng ký:
  register → verify-otp → login

Quên mật khẩu:
  forgot-password → verify-reset-otp → reset-password → login

Invite:
  (email từ admin) → accept-invite → [token tự động]

Google OAuth:
  /google/login → [Google chọn tài khoản] → /google/callback → [token]

Refresh token:
  refresh-token → [token mới] (token cũ bị revoke)
```
