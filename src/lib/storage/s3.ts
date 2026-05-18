import { S3Client } from "@aws-sdk/client-s3";

// Support both unified STORAGE_* keys or standard fallback AWS_* variables
const accessKeyId =
  process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.STORAGE_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.STORAGE_REGION || process.env.AWS_REGION || "auto";
const endpoint = process.env.STORAGE_ENDPOINT; // Required for Cloudflare R2, omitted for Native AWS S3

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "Cloud object storage credentials (Access Key/Secret) are missing from your environment variables.",
  );
}

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  endpoint: endpoint || undefined,
  // forcePathStyle is required for Cloudflare R2 and local development environments like LocalStack
  forcePathStyle: endpoint ? true : false,
});
