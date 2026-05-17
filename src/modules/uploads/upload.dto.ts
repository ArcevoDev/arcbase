import { z } from "zod";

export const presignRequestSchema = z
  .object({
    filename: z.string().min(1, "Original filename is strictly required").trim(),
    fileType: z.string().min(1, "MIME file type is strictly required").trim(),
    folder: z.enum(["thumbnails", "covers", "attachments"]).default("attachments"),
  })
  .strict();

export type PresignRequestInput = z.infer<typeof presignRequestSchema>;
