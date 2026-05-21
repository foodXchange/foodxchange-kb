import { cookies } from "next/headers";
import { signSession, COOKIE_NAME } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const { password, rememberMe } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 8,
    path: "/",
  });
  return Response.json({ ok: true });
}
