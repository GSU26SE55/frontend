import { z } from "zod";

export const reopenTicketSchema = z.object({
  reopenReason: z.string().max(500).optional(),
});

export type ReopenTicketFormValues = z.infer<typeof reopenTicketSchema>;
