// src/app/api/users/[username]/route.ts — public profile (no auth required)
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { UserService } from "@/domains/users/user.service";
import { prisma } from "@/core/db";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const profile = await userService.getPublicProfile(prisma, params.username);
  return NextResponse.json({ success: true, data: profile });
});
