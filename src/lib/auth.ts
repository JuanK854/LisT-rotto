import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";

export type AdminUser = { uid: string; email: string };

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Valida el ID token de Firebase del header Authorization y que el email
 * esté en la allowlist ADMIN_EMAILS. Devuelve el admin o null.
 */
export async function verifyAdmin(req: NextRequest): Promise<AdminUser | null> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;

  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    const email = decoded.email?.toLowerCase();
    if (!email || !decoded.email_verified) return null;
    if (!allowedEmails().has(email)) return null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
