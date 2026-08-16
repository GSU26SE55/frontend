import { z } from "zod";
import {
  IOT_COMMAND_TYPES,
  IotDeviceStatusEnum,
  POLLING_SECONDS_MAX,
  POLLING_SECONDS_MIN,
} from "@/shared/enums/iot/iot.enum";

// apiKeyScopes is a bitmask — a combo (e.g. 1|2=3) is NOT an enum member, so we use z.number instead of nativeEnum.
const apiKeyScopes = z
  .number()
  .int()
  .refine((v) => v !== 0, "Select at least 1 scope")
  .optional();

export const createIotDeviceSchema = z.object({
  deviceCode: z
    .string()
    .min(3, "Must be at least 3 characters")
    .max(64, "Must be at most 64 characters")
    .regex(/^[A-Z0-9-]+$/, "Only uppercase letters, digits, and hyphens"),
  displayName: z
    .string()
    .min(1, "Required")
    .max(200, "Must be at most 200 characters"),
  siteId: z.string().uuid("Select a site"),
  hardwareRevision: z
    .string()
    .max(64, "Must be at most 64 characters")
    .optional(),
  apiKeyScopes,
  heartbeatIntervalSeconds: z
    .number()
    .int()
    .min(10, "Must be at least 10 seconds")
    .max(3600, "Must be at most 3600 seconds")
    .optional(),
  notes: z.string().max(1000, "Must be at most 1000 characters").optional(),
});

export const updateIotDeviceSchema = z.object({
  displayName: z
    .string()
    .min(1, "Required")
    .max(200, "Must be at most 200 characters"),
  siteId: z.string().uuid("Select a site"),
  hardwareRevision: z
    .string()
    .max(64, "Must be at most 64 characters")
    .optional(),
  status: z.nativeEnum(IotDeviceStatusEnum),
  apiKeyScopes,
  heartbeatIntervalSeconds: z
    .number()
    .int()
    .min(10, "Must be at least 10 seconds")
    .max(3600, "Must be at most 3600 seconds")
    .optional(),
  targetFirmwareReleaseId: z.string().uuid().optional(),
  notes: z.string().max(1000, "Must be at most 1000 characters").optional(),
});

// Command `type` tự do; `params` là string JSON ở form → JSON.parse khi submit (parse fail → setError).
/**
 * Form gửi lệnh xuống thiết bị.
 *
 * Hai chế độ, mỗi lần chỉ một:
 *   • `guided` — chọn lệnh từ danh sách, tham số điền bằng ô riêng. Đây là đường mặc định và là
 *     đường DUY NHẤT người vận hành cần biết; không phải gõ JSON.
 *   • `raw`    — tự gõ tên lệnh + JSON. Nằm trong "Tuỳ chọn nâng cao", để gửi được lệnh mới trước
 *     khi giao diện kịp cập nhật.
 *
 * `pollingSeconds` giữ dạng CHUỖI ở tầng form: ô `<input type="number">` luôn trả chuỗi, và chuỗi
 * rỗng phải phân biệt được với số 0 (`z.coerce.number()` biến `""` thành `0`, tức "bỏ trống" sẽ
 * hiện lỗi "phải ≥ 1" thay vì "chưa nhập"). Đổi sang số lúc submit.
 */
export const deviceCommandSchema = z
  .object({
    mode: z.enum(["guided", "raw"]),
    // KHÔNG đặt `.min(1)` ở đây: hai chế độ cần hai lời nhắc khác nhau ("Select a command" vs
    // "Enter the command name"), mà lỗi ở tầng object thì chặn luôn `superRefine` không chạy.
    type: z.string(),
    pollingSeconds: z.string().optional(),
    params: z.string().optional(),
    cmdId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "guided") {
      if (!(IOT_COMMAND_TYPES as readonly string[]).includes(data.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["type"],
          message: "Select a command",
        });
        return;
      }

      // Chỉ set_interval có tham số; hai lệnh còn lại firmware bỏ qua params.
      if (data.type !== "set_interval") return;

      const raw = (data.pollingSeconds ?? "").trim();
      if (raw === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pollingSeconds"],
          message: "Enter the sampling interval",
        });
        return;
      }
      // Chặn cả số âm, số thập phân và "5s" — `Number()` đơn thuần nhận hết những thứ đó
      // (`Number("5.5")` = 5.5, `Number("")` = 0) rồi firmware mới là nơi từ chối.
      if (!/^\d+$/.test(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pollingSeconds"],
          message: "Must be a positive integer, in seconds",
        });
        return;
      }
      const seconds = Number(raw);
      if (seconds < POLLING_SECONDS_MIN || seconds > POLLING_SECONDS_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pollingSeconds"],
          message: `The device only accepts ${POLLING_SECONDS_MIN} to ${POLLING_SECONDS_MAX} seconds`,
        });
      }
      return;
    }

    // ── raw ──────────────────────────────────────────────────────────────────
    if (data.type.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type"],
        message: "Enter the command name",
      });
    }

    const rawParams = (data.params ?? "").trim();
    if (rawParams === "") return; // không tham số là hợp lệ

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawParams);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["params"],
        message: "Invalid JSON",
      });
      return;
    }
    // Backend serialize thẳng giá trị này vào trường `params` của gói lệnh, còn firmware đọc nó
    // bằng `params["pollingSeconds"]` — tức bắt buộc phải là object. Mảng hay số lọt xuống thì
    // thiết bị im lặng bỏ qua tham số, đúng kiểu lỗi "mọi tầng báo thành công".
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["params"],
        message: 'Payload must be an object, e.g. {"pollingSeconds": 5}',
      });
    }
  });

export type CreateIotDeviceForm = z.infer<typeof createIotDeviceSchema>;
export type UpdateIotDeviceForm = z.infer<typeof updateIotDeviceSchema>;
export type DeviceCommandForm = z.infer<typeof deviceCommandSchema>;
