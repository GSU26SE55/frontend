import { z } from "zod";
import { SiteStatusEnum } from "@/shared/types/site/site.types";

export const siteFormSchema = z.object({
  name: z.string().min(1, "Required").max(200),
  customerId: z.string().uuid("Select a customer"),
  address: z.string().max(500).optional(),
  installDate: z
    .string()
    .min(1, "Required")
    .refine(
      (v) => new Date(v) <= new Date(),
      "Install date cannot be in the future",
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
