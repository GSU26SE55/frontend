import { z } from "zod";
import { WarrantyStatusEnum } from "@/features/admin/enums/battery-asset.enum";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import { coordField } from "@/shared/schemas/common.schema";

export const batteryAssetFormSchema = z
  .object({
    serialNumber: z
      .string()
      .min(5, "Tối thiểu 5 ký tự")
      .max(64)
      .regex(/^[A-Z0-9-]+$/, "Chỉ chứa A-Z, 0-9, dấu -"),
    batteryTypeId: z.string().uuid("UUID không hợp lệ"),
    customerId: z.string().uuid("UUID không hợp lệ"),
    siteId: z.string().uuid().optional().or(z.literal("")),
    installDate: z
      .string()
      .min(1, "Bắt buộc")
      .refine(
        (v) => new Date(v) <= new Date(),
        "Ngày lắp đặt không được ở tương lai",
      )
      .refine((v) => {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        return new Date(v) >= fiveYearsAgo;
      }, "Ngày lắp đặt không được cũ hơn 5 năm"),
    warrantyEndDate: z.string().optional(),
    location: z.string().max(255).optional(),
    latitude: coordField("Vĩ độ", -90, 90),
    longitude: coordField("Kinh độ", -180, 180),
    notes: z.string().max(1000).optional(),
    // Chỉ dùng khi edit — BE update command nhận 2 field này (mặc định Active nếu thiếu)
    warrantyStatus: z.nativeEnum(WarrantyStatusEnum).optional(),
    status: z.nativeEnum(BatteryStatusEnum).optional(),
  })
  .refine(
    (d) =>
      !d.warrantyEndDate ||
      !d.installDate ||
      new Date(d.warrantyEndDate) > new Date(d.installDate),
    {
      path: ["warrantyEndDate"],
      message: "Ngày hết bảo hành phải sau ngày lắp đặt",
    },
  );

export type BatteryAssetFormValues = z.infer<typeof batteryAssetFormSchema>;

export const transferOwnerSchema = z.object({
  newCustomerId: z.string().uuid("Chọn khách hàng"),
  reason: z.string().max(500).optional(),
});

export type TransferOwnerFormValues = z.infer<typeof transferOwnerSchema>;
