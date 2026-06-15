import { z } from "zod";

export const reopenTicketSchema = z.object({
  // BE required (TicketReopenCommand) — rỗng → 400.
  reopenReason: z.string().min(1, "Lý do mở lại không được để trống").max(500),
});

export type ReopenTicketFormValues = z.infer<typeof reopenTicketSchema>;
