import { z } from "zod";
import { WarrantyStatusEnum } from "@/features/admin/enums/battery-asset.enum";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";

export const batteryAssetFormSchema = z
  .object({
    serialNumber: z
      .string()
      .min(5, "Must be at least 5 characters")
      .max(64)
      .regex(/^[A-Z0-9-]+$/, "Only A-Z, 0-9, and - are allowed"),
    batteryTypeId: z.string().uuid("Invalid UUID"),
    customerId: z.string().uuid("Invalid UUID"),
    siteId: z.string().uuid().optional().or(z.literal("")),
    installDate: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => new Date(v) <= new Date(),
        "Install date cannot be in the future",
      )
      .refine((v) => {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        return new Date(v) >= fiveYearsAgo;
      }, "Install date cannot be older than 5 years"),
    warrantyEndDate: z.string().optional(),
    location: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
    // Used only when editing — BE update command accepts these 2 fields (defaults to Active if omitted)
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
      message: "Warranty end date must be after the install date",
    },
  );

export type BatteryAssetFormValues = z.infer<typeof batteryAssetFormSchema>;

export const transferOwnerSchema = z.object({
  newCustomerId: z.string().uuid("Select a customer"),
  reason: z.string().max(500).optional(),
});

export type TransferOwnerFormValues = z.infer<typeof transferOwnerSchema>;
