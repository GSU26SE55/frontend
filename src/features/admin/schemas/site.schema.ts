import { z } from "zod";
import { SiteStatusEnum } from "@/shared/types/site.types";

export const siteFormSchema = z.object({
  name: z.string().min(1, "Bắt buộc").max(200),
  customerId: z.string().uuid("UUID không hợp lệ"),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  capacityKw: z.string().optional(),
  installDate: z.string().min(1, "Bắt buộc"),
  status: z.union([
    z.literal(SiteStatusEnum.Active),
    z.literal(SiteStatusEnum.UnderMaintenance),
    z.literal(SiteStatusEnum.Decommissioned),
  ]),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;
