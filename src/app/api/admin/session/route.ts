import { NextRequest, NextResponse } from "next/server";
import { db, todaySessionId } from "@/lib/supabase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/session — estado de la sesión de hoy (incluye el código). */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const sessionId = todaySessionId();
  const { data } = await db()
    .from("sessions")
    .select("open, code")
    .eq("id", sessionId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ sessionId, exists: false });
  }
  return NextResponse.json({
    sessionId,
    exists: true,
    open: data.open,
    code: data.code,
  });
}

/**
 * POST /api/admin/session  { action: "open" | "close" }
 * "open" crea la sesión de hoy con un código nuevo (o la reabre).
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const sessionId = todaySessionId();

  if (body.action === "open") {
    const { data: existing } = await db()
      .from("sessions")
      .select("code")
      .eq("id", sessionId)
      .maybeSingle();

    const code =
      existing?.code ?? String(Math.floor(1000 + Math.random() * 9000));

    const { error } = await db().from("sessions").upsert({
      id: sessionId,
      code,
      open: true,
      opened_by: admin.email,
    });
    if (error) {
      return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
    return NextResponse.json({ sessionId, open: true, code });
  }

  if (body.action === "close") {
    await db().from("sessions").update({ open: false }).eq("id", sessionId);
    return NextResponse.json({ sessionId, open: false });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
