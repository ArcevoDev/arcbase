import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Critical Configuration Invalidation: Process context variable JWT_SECRET is missing.");
}

const SECRET_KEY_BYTES = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email.toLowerCase(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(SECRET_KEY_BYTES);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY_BYTES, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.email) return null;

    return {
      userId: payload.userId as string,
      email: (payload.email as string).toLowerCase(),
    };
  } catch {
    return null;
  }
}
