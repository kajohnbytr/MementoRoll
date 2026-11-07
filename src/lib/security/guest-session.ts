import "server-only";
import { cookies } from "next/headers";

export const GUEST_COOKIE = "mr_guest_session";

export async function setGuestCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getGuestToken() {
  return (await cookies()).get(GUEST_COOKIE)?.value ?? null;
}
