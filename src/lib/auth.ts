import { NextRequest, NextResponse } from "next/server";
import { db } from "./supabase-admin";

export type AdminUser = { id: string; email: string };

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Valida el access token de Supabase del header Authorization y que el email
 * esté en la allowlist ADMIN_EMAILS. Devuelve el admin o null.
 */
export async function verifyAdmin(req: NextRequest): Promise<AdminUser | null> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;

  const { data, error } = await db().auth.getUser(match[1]);
  if (error || !data.user) return null;

  const email = data.user.email?.toLowerCase();
  if (!email || !allowedEmails().has(email)) return null;
  return { id: data.user.id, email };
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
