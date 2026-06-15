import { z } from "zod";
import { SiteStatusEnum } from "@/shared/types/site.types";

// Chuỗi toạ độ -> số trong khoảng cho phép (rỗng = bỏ qua)
const coord = (label: string, min: number, max: number) =>
  z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        v === "" ||
        (!isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} phải trong khoảng ${min} đến ${max}`,
    );

export const siteFormSchema = z.object({
  name: z.string().min(1, "Bắt buộc").max(200),
  customerId: z.string().uuid("UUID không hợp lệ"),
  address: z.string().max(500).optional(),
  latitude: coord("Vĩ độ", -90, 90),
  longitude: coord("Kinh độ", -180, 180),
  installDate: z
    .string()
    .min(1, "Bắt buộc")
    .refine(
      (v) => new Date(v) <= new Date(),
      "Ngày lắp đặt không được ở tương lai",
    ),
  status: z.union([
    z.literal(SiteStatusEnum.Active),
    z.literal(SiteStatusEnum.UnderMaintenance),
    z.literal(SiteStatusEnum.Decommissioned),
  ]),
  contactPersonName: z.string().max(150).optional(),
  contactPersonPhone: z.string().max(30).optional(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;
