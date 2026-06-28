import { z } from "zod";

// Select trả string ("1".."4") → validate là 1 trong 4, convert sang int khi submit.
export const topologyFormSchema = z.object({
  electricalTopology: z
    .string()
    .refine((v) => ["1", "2", "3", "4"].includes(v), "Chọn cách đấu nối điện"),
});

export type TopologyFormValues = z.infer<typeof topologyFormSchema>;
