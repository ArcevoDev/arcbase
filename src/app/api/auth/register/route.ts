import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await UserService.register({ username, email, password });

    // remove password hash before sending response
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
