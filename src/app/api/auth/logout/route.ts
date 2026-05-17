import { NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";

export const POST = handleApiRoute(async () => {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
});
