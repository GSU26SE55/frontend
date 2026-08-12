import { z } from "zod";

// Select returns a string ("1".."4") → validate it is one of the four, convert to int on submit.
export const topologyFormSchema = z.object({
  electricalTopology: z
    .string()
    .refine(
      (v) => ["1", "2", "3", "4"].includes(v),
      "Select an electrical wiring layout",
    ),
});

export type TopologyFormValues = z.infer<typeof topologyFormSchema>;
