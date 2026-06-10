# Plan — GH-36: [FE] Integrate FileStorage API (upload / download / delete)

## Metadata
- **Status:** SHIPPED | **Role:** FE | **Ngày:** 2026-05-20
- **Issue:** #36 — https://github.com/GSU26SE55/frontend/issues/36
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Tạo data layer hoàn chỉnh cho FileStorageService API (types, endpoints, service, hooks) để các feature khác (avatar, ticket attachment, maintenance photo) có thể tích hợp mà không gọi API trực tiếp vào component.

## Scope
**Trong scope:**
- Types: `FilePurposeEnum`, `FileStatusEnum`, `FileUploadResponse`, `FileMetadataResponse`
- Endpoints: thêm `FILES` section vào `src/shared/utils/endpoints.ts`
- Query keys: thêm `files` root key + factories vào `src/shared/utils/queryKeys.ts`
- Service functions: `uploadFile`, `getFileMetadata`, `getPresignedUrl`, `deleteFile`
- Hooks: `useUploadFile`, `useFileMetadata`, `usePresignedUrl`, `useDeleteFile`

**Ngoài scope:**
- UI components (FileUpload widget, ImageDisplay)
- Endpoints legacy theo `objectKey` (deprecated — FE mới không dùng)
- Hook cho download (`/api/files/{id}/download` dùng trực tiếp làm URL trong `<img src>`)
- Toast/error boundary tại layer hook — feature consumer tự xử lý qua `handleErrorApi`

## Files

### Tạo mới
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/file-storage/types/file-storage.types.ts` | create | Types + enums từ `docs/api-filestorage.md` |
| `src/features/file-storage/services/file-storage.service.ts` | create | 4 service functions |
| `src/features/file-storage/hooks/useUploadFile.ts` | create | `useMutation` — POST /upload |
| `src/features/file-storage/hooks/useFileMetadata.ts` | create | `useQuery` — GET /{id}/metadata |
| `src/features/file-storage/hooks/usePresignedUrl.ts` | create | `useQuery` — GET /{id}/presigned-url |
| `src/features/file-storage/hooks/useDeleteFile.ts` | create | `useMutation` — DELETE /{id} |

### Sửa đổi
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | Thêm `FILES` section |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `files` root key + factories |

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra file riêng — không define inline trong types.

| Enum | File |
|------|------|
| `FilePurposeEnum`, `FileStatusEnum` | `features/file-storage/types/file-storage.types.ts` (feature-local, không dùng cross-feature) |

## Types

```ts
// src/features/file-storage/types/file-storage.types.ts

export const FilePurposeEnum = {
  Other:            0,
  Avatar:           1,
  TicketAttachment: 2,
  MaintenancePhoto: 3,
  KbImage:          4,
  Firmware:         5,
} as const;
export type FilePurposeEnum = typeof FilePurposeEnum[keyof typeof FilePurposeEnum];

export const FileStatusEnum = {
  Uploaded:    0,
  Processing:  1,
  Ready:       2,
  Quarantined: 3,
  Deleted:     4,
} as const;
export type FileStatusEnum = typeof FileStatusEnum[keyof typeof FileStatusEnum];

export interface FileUploadResponse {
  fileId:      string;
  objectKey:   string;
  fileName:    string;
  contentType: string;
  size:        number;
  publicUrl:   string | null;
}

export interface FileMetadataResponse {
  fileId:      string;
  objectKey:   string;
  fileName:    string;
  contentType: string;
  size:        number;
  folderName:  string;
  purpose:     FilePurposeEnum;
  status:      FileStatusEnum;
  publicUrl:   string | null;
  createdAt:   string;
  updatedAt:   string | null;
}

export interface UploadFilePayload {
  file:        File;
  folderName?: string;  // BE default "default" nếu không truyền
  purpose?:    FilePurposeEnum;
}

export interface PresignedUrlOptions {
  expiresInMinutes?: number;  // range 1–1440, default 15
}
```

## Endpoints

```ts
// Thêm vào endpoints.ts
FILES: {
  UPLOAD:       '/api/files/upload',
  METADATA:     (id: string) => `/api/files/${id}/metadata`,
  DOWNLOAD:     (id: string) => `/api/files/${id}/download`,        // dùng trực tiếp làm src URL
  PRESIGNED_URL:(id: string) => `/api/files/${id}/presigned-url`,   // ?expiresInMinutes=N (1–1440, default 15)
  DELETE:       (id: string) => `/api/files/${id}`,
}
```

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/files/upload` | `FormData { file, folderName?, purpose? }` | `CommonResponse<FileUploadResponse>` |
| GET | `/api/files/{id}/metadata` | — | `CommonResponse<FileMetadataResponse>` |
| GET | `/api/files/{id}/presigned-url` | `?expiresInMinutes=N` | `CommonResponse<string>` |
| DELETE | `/api/files/{id}` | — | `CommonResponse<void>` |

## Query Keys

```ts
// KEY thêm:
files: 'files',  // root — invalidate toàn bộ files cache

// QUERY_KEY thêm:
files: {
  metadata:    (id: string) => [KEY.files, 'metadata', id] as const,
  presignedUrl:(id: string) => [KEY.files, 'presigned-url', id] as const,
}
```

## Approach
- Service functions nhận typed params → gọi `axiosInstance` → return `AxiosResponse<CommonResponse<T>>` trực tiếp — **không unwrap** (hook unwrap `response.data`, nhất quán với `auth.service.ts`)
- Upload dùng `FormData` — **không** set `Content-Type` thủ công (Axios tự set multipart boundary khi body là `FormData`)
- `useFileMetadata` và `usePresignedUrl`: `enabled: !!fileId` — không query khi `fileId` rỗng
- `useDeleteFile` `onSuccess`: `invalidateQueries({ queryKey: KEY.files })` — invalidate toàn bộ files cache (metadata + presignedUrl của mọi fileId); consumer cần biết để tránh surprise khi có nhiều queries active
- Download URL: `ENDPOINTS.FILES.DOWNLOAD(fileId)` — feature consumer tự dùng trong `<img src>` hoặc fallback từ `publicUrl ?? ENDPOINTS.FILES.DOWNLOAD(id)`

## Workflow

**Upload flow:**
```
Consumer → useUploadFile.mutateAsync({ file, purpose, folderName? })
→ OK:   trả FileUploadResponse → consumer dùng publicUrl hoặc ENDPOINTS.FILES.DOWNLOAD(fileId)
→ FAIL: handleErrorApi({ error, setError? })
         413 = file quá lớn → HttpError → toast
         400 listErrors[{field:'file'}] = extension không hợp lệ → EntityError → setError hoặc toast
```

**Get metadata flow:**
```
Consumer → useFileMetadata(fileId)  [disabled nếu fileId rỗng]
→ OK:   trả FileMetadataResponse (status, purpose, publicUrl...)
→ FAIL: 409 nếu file Processing/Quarantined → HttpError
         404 nếu file Deleted → HttpError
```

**Get presigned URL flow:**
```
Consumer → usePresignedUrl(fileId, { expiresInMinutes?: number })  [disabled nếu fileId rỗng]
→ OK:   trả presigned URL string → consumer redirect hoặc set href
→ FAIL: 409 Processing/Quarantined | 404 Deleted
```
> `expiresInMinutes` hợp lệ, range 1–1440, default 15. Service truyền qua axios `params: { expiresInMinutes }`. File nhạy cảm dùng `expiresInMinutes: 1`.

**Delete flow:**
```
Consumer → useDeleteFile.mutate(fileId)
→ OK:   invalidate KEY.files → consumer clear domain reference (avatarFileId, attachment...)
→ FAIL: 403 không có quyền | 404 không tìm thấy
```
> ⚠️ FE không gọi DELETE FileStorage trực tiếp nếu file đang được domain service tham chiếu. Phải clear reference trước (gọi endpoint nghiệp vụ), sau đó mới xóa.

## Edge Cases
- Upload file > 20MB → `413` → `HttpError` → feature consumer toast
- Upload extension không hợp lệ → `400 isSuccess=false listErrors[{field:'file'}]` → `EntityError`
- Metadata/presigned-url với file `Processing` hoặc `Quarantined` → `409` → `HttpError`
- `fileId` null/rỗng → hook disabled qua `enabled: !!fileId`
- `publicUrl` null → feature consumer dùng `publicUrl ?? ENDPOINTS.FILES.DOWNLOAD(fileId)`

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| TypeScript không lỗi | `npx tsc --noEmit` |
| ESLint 0 warning | `npx eslint src/features/file-storage src/shared/utils/endpoints.ts src/shared/utils/queryKeys.ts --max-warnings=0` |
| Build thành công | `npm run build` |

## Steps
- [x] Bước 1: Tạo `src/features/file-storage/types/file-storage.types.ts` — 2026-05-20
- [x] Bước 2: Thêm `FILES` vào `src/shared/utils/endpoints.ts` — 2026-05-20
- [x] Bước 3: Thêm `files` key vào `src/shared/utils/queryKeys.ts` — 2026-05-20
- [x] Bước 4: Tạo `src/features/file-storage/services/file-storage.service.ts` — 2026-05-20
- [x] Bước 5: Tạo `src/features/file-storage/hooks/useUploadFile.ts` — 2026-05-20
- [x] Bước 6: Tạo `src/features/file-storage/hooks/useFileMetadata.ts` — 2026-05-20
- [x] Bước 7: Tạo `src/features/file-storage/hooks/usePresignedUrl.ts` — 2026-05-20
- [x] Bước 8: Tạo `src/features/file-storage/hooks/useDeleteFile.ts` — 2026-05-20
- [x] Bước 9: `tsc --noEmit` + `eslint --max-warnings=0` → PASS — 2026-05-20

## Câu hỏi đã giải đáp
| Câu hỏi | Quyết định |
|---------|-----------|
| Service có unwrap không? | Không — confirm từ `auth.service.ts`: service trả `AxiosResponse<CommonResponse<T>>`, hook unwrap `response.data`. |
| `folderName` default là gì? | BE default `"default"` nếu client không truyền — optional trong payload. |
| `usePresignedUrl` có `expiresInMinutes` không? | Có — confirm từ `docs/api-filestorage.md`: query param range 1–1440, default 15. Thêm `PresignedUrlOptions` type, truyền qua axios `params`. |
| Query key shape? | `KEY.files` (root) + `QUERY_KEY.files.metadata(id)` + `QUERY_KEY.files.presignedUrl(id)`. |
| `useDeleteFile` invalidate scope? | Invalidate `KEY.files` (toàn bộ) — chấp nhận được ở phase data layer, đã note để consumer biết. |
