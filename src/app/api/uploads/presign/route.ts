export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { s3Client } from "@/lib/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { presignRequestSchema } from "@/modules/uploads/upload.dto";
import crypto from "crypto";

// POST /api/uploads/presign -> Request secure write ticket signature
export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON configuration body payload");
  }

  const validation = presignRequestSchema.safeParse(rawBody);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { filename, fileType, folder } = validation.data;
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!bucketName) {
    throw ApiError.internal("Cloud bucket name parameters are missing from server configuration");
  }

  // Generate safe filename layout (e.g. attachments/2026-05-16-a1b2c3d4-myfile.pdf)
  const dateString = new Date().toISOString().split("T")[0];
  const uniqueId = crypto.randomBytes(4).toString("hex");
  const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileKey = `${folder}/${dateString}-${uniqueId}-${sanitizedName}`;

  // Assemble the explicit object payload request command definition
  const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: fileType,
  });

  // Sign ticket signature wrapper (Expires in 15 minutes to guarantee security)
  const uploadUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 900 });
  
  // Construct the finalized clean link address that will be saved in resource model fields
  const permanentFileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}://{fileKey}`;

  return NextResponse.json(
    {
      success: true,
      uploadUrl,         // The target endpoint the frontend puts raw binary files to
      permanentFileUrl,  // The final address saved to 'thumbnailUrl' or 'fileUrl' fields
    },
    { status: 200 }
  );
});
