import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");

const SECRET = new TextEncoder().encode(JWT_SECRET);

// 1. Extend the global token type definition
export interface JwtPayload {
  userId: string;
  email: string;
  hasCompletedOnboarding: boolean; // Injected flag token type
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ 
    userId: payload.userId, 
    email: payload.email.toLowerCase(),
    hasCompletedOnboarding: payload.hasCompletedOnboarding // Pass explicitly to encoder
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId || !payload.email) return null;
    
    return {
      userId: payload.userId as string,
      email: (payload.email as string).toLowerCase(),
      hasCompletedOnboarding: !!payload.hasCompletedOnboarding // Read and pass explicitly to validator
    };
  } catch {
    return null;
  }
}
