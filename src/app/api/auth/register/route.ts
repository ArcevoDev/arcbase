/**
 * Example: arcbase register flow updated to use arc-id
 * src/app/api/auth/register/route.ts
 *
 * Before: created LocalAccount, hashed password, stored in arcbase DB
 * After:  delegates to arc-id, gets identityId back, creates arcbase User
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiRoute } from "@/lib/errors";
import { prisma } from "@/core/db";
import { arcid } from "@/lib/arcid/client";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  displayName: z.string().optional(),
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();
  const input = RegisterSchema.parse(body);

  const { identity } = await arcid.register(input.email, input.password, input.displayName);

  const usernameTaken = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (usernameTaken) {
    return NextResponse.json(
      { success: false, error: "CONFLICT", message: "Username is already taken" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      identityId: identity.id,
      username: input.username,
      displayName: input.displayName,
    },
  });

  return NextResponse.json({ success: true, data: { userId: user.id } }, { status: 201 });
});
