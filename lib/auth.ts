import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "attend_sbs_token";
const JWT_SECRET = process.env.JWT_SECRET || "attend-sbs-fallback-secret-2026";

export interface SessionUser {
  userId: string;
  role: "ADMIN" | "USER";
  username: string;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    if (decoded && decoded.userId && decoded.role) {
      return {
        userId: decoded.userId,
        role: decoded.role,
        username: decoded.username,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
