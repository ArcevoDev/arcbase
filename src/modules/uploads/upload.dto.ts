import { z } from "zod";

// Explicit white list of allowed payload extensions to prevent malware execution
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "text/plain",
];

export const requestUploadSchema = z
  .object({
    filename: z.string().min(1, "Filename string payload cannot be left empty"),
    contentType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]], {
      error:
        "Target file type extension is completely restricted from upload",
    }),
    sizeInBytes: z
      .number()
      .max(
        50 * 1024 * 1024,
        "File uploads are physically performance-capped at 50MB",
      ),
  })
  .strict();

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export interface PresignedUploadResponseDTO {
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
}
