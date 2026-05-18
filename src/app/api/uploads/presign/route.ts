import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { UploadService } from "@/modules/uploads/upload.service";
import { requestUploadSchema } from "@/modules/uploads/upload.dto";
import { ApiError } from "@/lib/errors/api-error";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);

  const body = await req.json();
  const parsed = requestUploadSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const uploadService = new UploadService();
  const allocationPayload = await uploadService.generatePresignedUploadTarget(
    session.userId,
    parsed.data,
  );

  return NextResponse.json(
    {
      success: true,
      message:
        "Secure cloud storage upload signature authorization generated. Valid for 15 minutes.",
      data: allocationPayload,
    },
    { status: 200 },
  );
});
