import { z } from "zod";
import { TicketCategoryEnum } from "@/shared/types/ticket.types";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200),
  description: z.string().min(1, "Mô tả không được để trống").max(2000),
  category: z.nativeEnum(TicketCategoryEnum),
  batteryAssetId: z.string().uuid("ID pin không hợp lệ").optional(),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;
