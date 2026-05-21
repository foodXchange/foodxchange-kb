export const COOKIE_NAME = "kb_session";
const MAX_AGE_DAYS = 365;

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET!;
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signSession(): Promise<string> {
  const payload = btoa(JSON.stringify({ ts: Date.now(), role: "admin" }));
  const key = await getKey();
  const sig = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return `${payload}.${toHex(sig)}`;
}

export async function verifySession(cookie: string): Promise<boolean> {
  try {
    const [payload, sig] = cookie.split(".");
    if (!payload || !sig) return false;
    const key = await getKey();
    const expected = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload)
    );
    if (toHex(expected) !== sig) return false;
    const { ts } = JSON.parse(atob(payload)) as { ts: number };
    return (Date.now() - ts) / 86400000 < MAX_AGE_DAYS;
  } catch {
    return false;
  }
}
