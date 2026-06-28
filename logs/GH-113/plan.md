# Plan — GH-113: IoT Device Management — Admin module (devices · API key · calibration · firmware OTA)

## Metadata
- **Status:** IN_PROGRESS | **Role:** FE | **Ngày:** 2026-06-28
- **Issue:** #113 — https://github.com/GSU26SE55/frontend/issues/113
- **Sprint:** Sprint 4 (due 2026-07-11)
- **Dev:** Trần Minh Trí (FE Leader)

## Mục tiêu
FE module quản lý vòng đời IoT edge device (ESP32-S3) — consume **Nhóm 11** của BatteryService:
- **Admin:** CRUD device, rotate/revoke API key, push command, quản lý firmware OTA release (upload .bin → tạo release → publish/archive).
- **Staff:** xem + thêm + xóa calibration cảm biến của device.
- **Manager:** xem danh sách calibration sắp hết hạn (cross-device).

Ref contract: `backend/docs/api-battery.md` §Nhóm 11 (dòng 1889–2420).

## Scope
**Trong scope:**
- **11C — Admin Devices:** list (filter site/status/keyword + pagination), detail, create, update, delete (decommission), rotate-key, revoke-key, command.
- **11B — Calibration:** list theo device, create, delete, calibrations-expiring (cross-device).
- **11D — Firmware Releases:** list, create qua **upload-binary 2-step** (upload `.bin` → POST metadata), publish, archive.
- Secret reveal 1 lần (rawApiKey + provisioningQrCode + MQTT creds) khi create device / rotate-key.
- 3 portal: Admin (full) · Staff (calibration) · Manager (calibrations-expiring).

**Ngoài scope:**
- **11A — Device self-service** (`provision`/`heartbeat`/`firmware-check`/`firmware-update-log`): auth ApiKey per-device, do firmware ESP32 gọi — KHÔNG phải FE.
- Tạo firmware release bằng **metadata thủ công** (nhập tay artifactUrl/sha256/size) — đã chốt chỉ dùng upload-binary.
- Firmware update-log history per-device (BE không có admin endpoint list logs) → tab Firmware của Device Detail chỉ show current/target version.
- Realtime device heartbeat stream / MQTT ack UI.

## Endpoints
Tất cả auth JWT. `[A]`=Admin, `[S]`=Staff, `[M]`=Manager.

| Method | Path | Auth | Mục đích / Response |
|--------|------|------|---------------------|
| GET | `/api/admin/iot-devices` | A | List `PaginationResponse<IotDeviceDto>` — query `siteId,status,keyword,page,pageSize,isDescending` |
| GET | `/api/admin/iot-devices/{id}` | A | `IotDeviceDto` (không có raw key) |
| POST | `/api/admin/iot-devices` | A | Create → `IotDeviceCreatedDto` (**secrets 1 lần**), 201 |
| PUT | `/api/admin/iot-devices/{id}` | A | Update metadata+status+scopes+targetFirmware → `IotDeviceDto` |
| DELETE | `/api/admin/iot-devices/{id}` | A | Decommission (soft-delete + revoke) → `object` |
| POST | `/api/admin/iot-devices/{id}/rotate-key` | A | `IotDeviceCreatedDto` (**secrets 1 lần**), **200** (không phải 201) |
| POST | `/api/admin/iot-devices/{id}/revoke-key` | A | `object` |
| POST | `/api/admin/iot-devices/{id}/command` | A | Body `{cmdId?, type, params?}` → `IotDeviceCommandAcceptedDto`, **202** |
| GET | `/api/iot-devices/{deviceId}/calibrations` | A/S/M | Flat `IotDeviceCalibrationDto[]` — query `channel?,includeExpired?` |
| POST | `/api/iot-devices/{deviceId}/calibrations` | A/S | Create → `IotDeviceCalibrationDto`, 201 |
| DELETE | `/api/iot-devices/{deviceId}/calibrations/{calibrationId}` | A/S | `object` |
| GET | `/api/iot-devices/calibrations-expiring` | A/M | Flat `IotDeviceCalibrationDto[]` — query `within?` (default 30, clamp 1–365) |
| GET | `/api/admin/iot-firmware-releases` | A | List `PaginationResponse<IotFirmwareReleaseDto>` — query `hardwareRevision?,publishedOnly?,page,pageSize` |
| POST | `/api/admin/iot-firmware-releases` | A | Create release metadata → `IotFirmwareReleaseDto`, 201 |
| POST | `/api/admin/iot-firmware-releases/upload-binary` | A | multipart, request ≤**60MB** (spec 2396, lỗi 413) → `FirmwareBinaryUploadDto` (artifactUrl+sha256+size), **không tạo release** |
| POST | `/api/admin/iot-firmware-releases/{id}/publish` | A | `IotFirmwareReleaseDto` |
| POST | `/api/admin/iot-firmware-releases/{id}/archive` | A | `object` |

## Enums
Dùng ≥ 2 feature (admin + staff + manager) → đặt ở `shared/enums/iot.enum.ts`. Pattern `as const` (int values từ BE).

| Enum | Values | File nguồn |
|------|--------|-----------|
| IotDeviceStatusEnum | Pending=1, Active=2, Offline=3, Disabled=4, Decommissioned=5 | shared/enums/iot.enum.ts |
| IotApiKeyScopeEnum | None=0, SensorIngest=1, DeviceHeartbeat=2, EnvironmentalIngest=4, FirmwareCheck=8, EdgeDeviceDefault=11 (**[Flags] bitmask**) | shared/enums/iot.enum.ts |
| IotFirmwareChannelEnum | Stable=1, Beta=2 | shared/enums/iot.enum.ts |

- `IOT_COMMAND_TYPES` (const array, không phải enum): `["reboot","ota","sample-now","calibrate","set-config"]` + cho phép nhập custom — dùng cho dropdown command dialog.
- Bitmask helper trong enum file: `hasScope(value, flag)`, `toggleScope(value, flag)` để render checkbox scopes.

## Types
`shared/types/iot.types.ts` — import + re-export enum từ `shared/enums/iot.enum.ts`, KHÔNG define enum inline. Guid/DateTime từ BE → `string` ở FE.

```ts
// Devices
interface IotDeviceDto {
  id: string; deviceCode: string; displayName: string;
  siteId: string; siteName: string | null; hardwareRevision: string | null;
  status: IotDeviceStatusEnum; currentFirmwareVersion: string | null;
  targetFirmwareReleaseId: string | null; targetFirmwareVersion: string | null;
  apiKeyScopes: IotApiKeyScopeEnum; apiKeyLastFour: string;
  apiKeyIssuedAt: string; apiKeyRevokedAt: string | null;
  lastSeenAt: string | null; lastProvisionedAt: string | null; lastOfflineAt: string | null;
  heartbeatIntervalSeconds: number; lastClockSkewSeconds: number | null;
  notes: string | null; createdAt: string;
}
interface IotDeviceCreatedDto extends IotDeviceDto {  // secrets — chỉ trả 1 lần
  rawApiKey: string; provisioningQrCode: string;
  mqttUsername: string; mqttPassword: string; mqttBrokerHost: string; mqttBrokerPort: number;
}
interface CreateIotDevicePayload { deviceCode: string; displayName: string; siteId: string;
  hardwareRevision?: string; apiKeyScopes?: IotApiKeyScopeEnum; heartbeatIntervalSeconds?: number; notes?: string; }
interface UpdateIotDevicePayload { displayName: string; siteId: string; hardwareRevision?: string;
  status: IotDeviceStatusEnum; apiKeyScopes?: IotApiKeyScopeEnum; heartbeatIntervalSeconds?: number;
  targetFirmwareReleaseId?: string; notes?: string; }
interface IotDeviceListParams { siteId?: string; status?: IotDeviceStatusEnum; keyword?: string;
  page?: number; pageSize?: number; isDescending?: boolean; }
interface SendCommandPayload { cmdId?: string; type: string; params?: Record<string, unknown>; }
interface IotDeviceCommandAcceptedDto { cmdId: string; deviceCode: string; topic: string; }

// Calibration
interface IotDeviceCalibrationDto { id: string; iotDeviceId: string; channel: string;
  batteryAssetId: string | null; scale: number; offset: number; unit: string;
  calibratedAt: string; expiresAt: string | null; notes: string | null; createdAt: string; }
interface CreateCalibrationPayload { channel: string; batteryAssetId?: string; scale: number;
  offset: number; unit: string; calibratedAt: string; expiresAt?: string; notes?: string; }
interface CalibrationListParams { channel?: string; includeExpired?: boolean; }

// Firmware
interface IotFirmwareReleaseDto { id: string; version: string; hardwareRevision: string;
  artifactUrl: string; sha256Checksum: string; artifactSizeBytes: number; releaseNotes: string | null;
  isPublished: boolean; publishedAt: string | null; isArchived: boolean; createdAt: string;
  isRequired: boolean; channel: IotFirmwareChannelEnum; deviceModel: string | null; }
interface FirmwareBinaryUploadDto { artifactUrl: string; sha256Checksum: string;
  artifactSizeBytes: number; fileName: string; version: string; hardwareRevision: string; isRequired: boolean; }
interface CreateFirmwareReleasePayload { version: string; hardwareRevision: string; artifactUrl: string;
  sha256Checksum: string; artifactSizeBytes: number; releaseNotes?: string; publishImmediately?: boolean;
  isRequired?: boolean; channel?: IotFirmwareChannelEnum; deviceModel?: string; }
interface UploadFirmwareBinaryPayload { file: File; version: string; hardwareRevision: string;
  isRequired?: boolean; channel?: IotFirmwareChannelEnum; releaseNotes?: string; deviceModel?: string; }
interface FirmwareReleaseListParams { hardwareRevision?: string; publishedOnly?: boolean; page?: number; pageSize?: number; }
```

## Schema (Zod)
```ts
// iot-device.schema.ts
deviceCode: z.string().min(3).max(64).regex(/^[A-Z0-9-]+$/)   // chỉ create
displayName: z.string().min(1).max(200)
siteId: z.string().uuid()
hardwareRevision: z.string().max(64).optional()
apiKeyScopes: z.number().int().refine(v => v !== 0).optional()  // != None; form defaultValues:{apiKeyScopes:11} (EdgeDeviceDefault)
heartbeatIntervalSeconds: z.number().int().min(10).max(3600)
status: z.nativeEnum(IotDeviceStatusEnum)                      // chỉ update
notes: z.string().max(1000).optional()

// device-command.schema.ts
type: z.string().min(1)
params: z.string().optional()  // form: string (JSON textarea). Submit: JSON.parse → Record<string,unknown> ở SendCommandPayload; parse fail → setError("params",...) KHÔNG gọi API; rỗng → params=undefined

// calibration.schema.ts
channel: z.string().min(1).max(32)
scale: z.number().refine(v => v !== 0)
offset: z.number()
unit: z.string().min(1).max(16)
calibratedAt: z.string().min(1)
expiresAt: z.string().optional().refine(> calibratedAt nếu có)
notes: z.string().max(500).optional()

// firmware-upload.schema.ts
file: z.instanceof(File).refine(f => f.name.endsWith(".bin")).refine(f => f.size <= 50_000_000)
// ⚠️ 50MB (50_000_000), KHÔNG 60MB. 2-step: upload-binary cho ≤60MB nhưng create-metadata bước 2 validate
// artifactSizeBytes <= 50MB (spec 2348, lỗi 400). Chặn ở Zod 50MB để tránh file 50–60MB lên storage thành rác
// (không có endpoint xóa lẻ) rồi fail 400 khó hiểu ở bước 2.
version: z.string().regex(/^\d+\.\d+\.\d+$/)
hardwareRevision: z.string().min(1)
channel: z.nativeEnum(IotFirmwareChannelEnum).optional()
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/iot.enum.ts` | create | 3 enum + hasScope/toggleScope + IOT_COMMAND_TYPES |
| `src/shared/types/iot.types.ts` | create | DTO + payload + params (re-export enum) |
| `src/shared/utils/endpoints.ts` | modify | + IOT_DEVICES, IOT_CALIBRATIONS, IOT_FIRMWARE |
| `src/shared/utils/queryKeys.ts` | modify | + KEY.iotDevices/iotCalibrations/iotFirmware + QUERY_KEY factories |
| `src/features/admin/services/iot-device.service.ts` | create | list/getById/create/update/delete/rotateKey/revokeKey/sendCommand |
| `src/features/admin/services/iot-firmware.service.ts` | create | list/uploadBinary/create/publish/archive |
| `src/shared/services/iot-calibration.service.ts` | create | cross-feature (admin+staff+manager): list/create/delete/listExpiring |
| `src/features/admin/hooks/useIotDevices.ts` | create | list query |
| `src/features/admin/hooks/useIotDevice.ts` | create | detail query |
| `src/features/admin/hooks/useIotDeviceMutations.ts` | create | create/update/delete/rotate/revoke/command |
| `src/features/admin/hooks/useIotFirmware.ts` | create | list query |
| `src/features/admin/hooks/useIotFirmwareMutations.ts` | create | uploadBinary+create (2-step)/publish/archive |
| `src/shared/hooks/useIotCalibrations.ts` | create | list + expiring query |
| `src/shared/hooks/useIotCalibrationMutations.ts` | create | create/delete (invalidate `iot:calibration` keys) |
| `src/features/admin/schemas/iot-device.schema.ts` | create | create + update device |
| `src/features/admin/schemas/iot-firmware.schema.ts` | create | upload firmware |
| `src/shared/schemas/iot-calibration.schema.ts` | create | calibration (cross-feature) |
| `src/features/admin/pages/IoTDevicesPage.tsx` | create | list `/admin/iot-devices` |
| `src/features/admin/pages/IoTDeviceFormPage.tsx` | create | create/edit `/admin/iot-devices/new` + `/:id/edit` |
| `src/features/admin/pages/IoTDeviceDetailPage.tsx` | create | tabs: Overview · Calibrations · Firmware `/admin/iot-devices/:id` |
| `src/features/admin/pages/IoTFirmwareReleasesPage.tsx` | create | list + publish/archive `/admin/iot-firmware` |
| `src/features/admin/pages/IoTFirmwareFormPage.tsx` | create | upload `/admin/iot-firmware/new` |
| `src/features/admin/components/IoTDeviceTable.tsx` | create | list table + status badge |
| `src/features/admin/components/IoTDeviceForm.tsx` | create | form body (dùng trong FormPage) |
| `src/features/admin/components/ApiKeyScopesField.tsx` | create | bitmask checkbox group |
| `src/features/admin/components/DeviceCommandDialog.tsx` | create | type dropdown + params JSON (ít field → dialog) |
| `src/features/admin/components/DeviceSecretsDialog.tsx` | create | reveal rawApiKey + QR + MQTT, copy buttons |
| `src/features/admin/components/RotateRevokeKeyDialog.tsx` | create | AlertDialog confirm |
| `src/features/admin/components/IoTFirmwareTable.tsx` | create | list + publish/archive AlertDialog |
| `src/features/admin/components/IoTDeviceStatusBadge.tsx` | create | màu theo status |
| `src/shared/components/iot/CalibrationTable.tsx` | create | cross-feature table |
| `src/shared/components/iot/CalibrationFormDialog.tsx` | create | create calibration (dialog, ngữ cảnh device) |
| `src/shared/components/iot/CalibrationsExpiringTable.tsx` | create | cho Manager |
| `src/features/staff/pages/IoTCalibrationsPage.tsx` | create | Staff `/staff/iot-devices` (⚠ xem Assumption) |
| `src/features/manager/pages/CalibrationsExpiringPage.tsx` | create | Manager `/manager/iot-calibrations` |
| `src/router/index.tsx` | modify | + routes admin/staff/manager |
| `src/shared/components/layout/AppLayout.tsx` | modify | + nav: Admin (IoT Devices, Firmware), Staff (IoT Calibration), Manager (Calibration sắp hết hạn) |

## Approach
- **Service layer** (rule: không gọi API trong component): mỗi service import `axiosInstance` + `ENDPOINTS`. Upload firmware dùng `FormData` + `headers:{ "Content-Type": undefined }` (theo `file-storage.service.ts`).
- **Firmware 2-step** (`useIotFirmwareMutations.create`): `mutationFn` chạy tuần tự `uploadBinary(file)` → lấy `{artifactUrl, sha256Checksum, artifactSizeBytes}` → `createRelease({...metadata, ...artifact, publishImmediately})`. 1 mutation, 2 API call.
- **Secret reveal**: `create`/`rotateKey` trả `IotDeviceCreatedDto` → onSuccess mở `DeviceSecretsDialog` hiển thị secrets + copy, kèm cảnh báo "chỉ hiện 1 lần". Không lưu secrets vào cache/query.
- **API key scopes (bitmask)**: `ApiKeyScopesField` render checkbox cho từng flag (1/2/4/8) + preset "EdgeDeviceDefault (11)"; submit ra 1 number qua `hasScope/toggleScope`.
- **Calibration cross-feature**: service + hook + components ở `shared/` → admin (detail tab), staff (page), manager (expiring page) đều import từ shared → KHÔNG vi phạm `no-restricted-imports`.
- **Cache invalidate**: device mutations → `KEY.iotDevices`; calibration mutations → `KEY.iotCalibrations` (BE tự clear Redis); firmware → `KEY.iotFirmware`.
- **Error handling**: form (device/firmware/calibration) → `try-catch mutateAsync` + `handleErrorApi({error, setError})`; non-form (delete/rotate/revoke/publish/archive/command) → `onError` của mutation → `handleErrorApi({error})` toast.

## Edge Cases
- **Status int=0 không có ở IoT** (khác `AccountStatusEnum`) — nhưng `IotApiKeyScopeEnum.None=0` là giá trị thật → khi check scope dùng so sánh bitmask, KHÔNG `if (scopes)`.
- **command params**: textarea JSON rỗng → gửi `undefined`; JSON sai cú pháp → `setError("params", ...)` không gọi API.
- **command 503** (MQTT bridge down) → toast lỗi rõ ràng, không crash.
- **device mới tạo = `Status=Pending`** (spec dòng 2187): chưa provision/heartbeat → badge "Pending" (màu trung tính/xám), KHÔNG hiện `lastSeenAt`. `IoTDeviceStatusBadge` phải cover đủ 5 state (Pending/Active/Offline/Disabled/Decommissioned).
- **device `Disabled`/`Decommissioned`**: ẩn/disable nút command + rotate-key.
- **Revoke vs Rotate key lifecycle** (spec rotate dòng 2250–2258, revoke 2260–2268):
  - Nút **Revoke** ẩn khi key đã revoke (`apiKeyRevokedAt != null`). `revoke-key` set `apiKeyRevokedAt=UtcNow` + `Status=Disabled`.
  - `rotate-key` **bỏ revoke** (`apiKeyRevokedAt → null`, reset `apiKeyIssuedAt`) nhưng **KHÔNG đổi `Status`** → device từng bị revoke (Disabled) sau rotate vẫn `Disabled` nhưng key đã hợp lệ lại.
  - Sau `rotate-key` & `revoke-key` mutation phải **invalidate detail query** (`QUERY_KEY.iotDevices.detail(id)`) để UI refetch → nút Revoke hiện lại sau rotate, ẩn sau revoke. Không tự suy diễn state ở client, lấy từ DTO mới.
- **calibration `deviceId` sai** → BE trả mảng rỗng (không 404) → hiện EmptyState.
- **calibrations-expiring**: chỉ item có `expiresAt` trong `(now, now+within]`; `within` clamp 1–365 ở UI input.
- **firmware upload >50MB / không phải .bin** → chặn ở Zod trước khi gọi API (50MB = min của 2 giới hạn: upload-binary ≤60MB vs create-metadata ≤50MB; do 2-step nên giới hạn thực tế là 50MB).
- **firmware update PUT 409** (target chưa publish/đã archive) → toast; dropdown targetFirmware chỉ list release `isPublished && !isArchived`.
- **secrets dialog đóng** → không có cách lấy lại key → cảnh báo trước khi đóng.

## Assumptions / ⚠️ Cần xác nhận với BE
1. **Staff không có endpoint list device.** `GET /api/admin/iot-devices` chỉ Admin. Staff có quyền calibration nhưng cần `deviceId`. **Giả định:** BE mở `GET /api/admin/iot-devices` (hoặc 1 endpoint list device read-only) cho Staff để `StaffIoTCalibrationsPage` browse được device → chọn device → mở calibration. Nếu BE KHÔNG mở → Staff page chỉ truy cập qua deviceId trực tiếp (vd từ ticket/battery context) và phần list sẽ cắt khỏi scope. **→ Hỏi BE trước khi code Staff page.**
2. Manager `calibrations-expiring` đặt làm **page riêng** `/manager/iot-calibrations` + link từ Manager dashboard (không nhúng widget vào DashboardPage để tránh sửa file lớn ngoài scope).

## Acceptance Criteria
- [ ] Admin: list device có filter (site/status/keyword) + pagination; tạo/sửa/xóa device hoạt động.
- [ ] Device mới tạo hiển thị badge **Pending**; `IoTDeviceStatusBadge` render đúng cả 5 state (Pending/Active/Offline/Disabled/Decommissioned).
- [ ] Tạo device + rotate-key hiển thị secrets (rawApiKey, QR, MQTT) đúng 1 lần, có nút copy.
- [ ] Revoke-key đổi status → Disabled + ẩn nút Revoke; **rotate-key sau revoke** làm nút Revoke hiện lại (apiKeyRevokedAt=null) trong khi Status vẫn Disabled. Command gửi được + nhận 202 (toast topic).
- [ ] Device Detail có 3 tab; tab Calibrations list + thêm (dialog) + xóa calibration.
- [ ] Firmware: upload `.bin` → tạo release (2-step) → publish/archive hoạt động; validate .bin + **≤50MB** (giới hạn thực tế của 2-step) + SemVer.
- [ ] Staff: thêm/xóa calibration được (theo Assumption #1 đã chốt với BE).
- [ ] Manager: xem calibration sắp hết hạn với `within` tùy chỉnh.
- [ ] Form lỗi map xuống field (`EntityError`), lỗi chung ra toast (`HttpError`).
- [ ] Routes gated đúng role; nav menu hiển thị theo role.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS (không cross-feature import).

## Steps
- [ ] **Bước 1 — Enums + Types:** `shared/enums/iot.enum.ts`, `shared/types/iot.types.ts`.
- [ ] **Bước 2 — Endpoints + QueryKeys:** thêm block IoT vào `endpoints.ts` + `queryKeys.ts`.
- [ ] **Bước 3 — Services:** `iot-device.service.ts`, `iot-firmware.service.ts`, `shared/services/iot-calibration.service.ts`.
- [ ] **Bước 4 — Hooks:** device (list/detail/mutations), firmware (list/mutations 2-step), calibration (shared list/expiring/mutations).
- [ ] **Bước 5 — Schemas (Zod):** device, command, firmware-upload, calibration.
- [ ] **Bước 6 — Components:** table/form/badge device, ApiKeyScopesField, DeviceCommandDialog, DeviceSecretsDialog, RotateRevokeKeyDialog, firmware table/form, shared calibration table/dialog/expiring.
- [ ] **Bước 7 — Pages:** Admin (Devices list/detail/form, Firmware list/form), Staff (calibration — sau khi chốt Assumption #1), Manager (expiring).
- [ ] **Bước 8 — Wire router + sidebar nav** theo role.
- [ ] **Bước 9 — Quality gate:** `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.

> ⚠️ Module lớn (~35 files). Đề nghị commit theo từng sub-domain (devices → firmware → calibration) để dễ review, nhưng vẫn 1 PR / 1 branch `feat/GH-113-iot-device-management`.

## Câu hỏi đã giải đáp
1. **Scope** → làm cả 3 sub-domain trong #113 (all-in-one).
2. **Portal** → Admin + Staff + Manager.
3. **Layout** → form nhiều field → page; form ít field → dialog. (Device form, Firmware form = page; command, calibration, key actions, secrets = dialog.)
4. **Calibration form** → dialog (ngoại lệ theo ngữ cảnh device, dù 8 field), nằm trong tab của Device Detail.
5. **Firmware create** → chỉ upload-binary, 2-step tự động (upload-binary trả artifact info → POST metadata tạo release). Bỏ flow nhập metadata thủ công. Vẫn wire cả 2 endpoint vì upload-binary KHÔNG tự tạo release.
