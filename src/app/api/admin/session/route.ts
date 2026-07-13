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
 * POST /api/admin/session
 *  { action: "open" | "close" }                   → sesión de hoy
 *  { action: "create", sessionId: "YYYY-MM-DD" }  → crea una fecha pasada
 *                                                    (cerrada, para rellenarla a mano)
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  let body: { action?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const sessionId = todaySessionId();

  if (body.action === "create") {
    const date = body.sessionId ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
    if (date > sessionId) {
      return NextResponse.json(
        { error: "No se pueden crear fechas futuras" },
        { status: 400 }
      );
    }
    // Cerrada y con código placeholder: nadie puede registrarse solo en fechas pasadas
    const { error } = await db()
      .from("sessions")
      .upsert(
        { id: date, code: "0000", open: false, opened_by: admin.email },
        { ignoreDuplicates: true }
      );
    if (error) {
      return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
    return NextResponse.json({ sessionId: date, open: false });
  }

  if (body.action === "open") {
    const { data: existing } = await db()
      .from("sessions")
      .select("code")
      .eq("id", sessionId)
      .maybeSingle();

    // Un código por día: reabrir el mismo día conserva el código.
    // "0000" es el placeholder que deja el marcado manual: nunca usarlo como código real.
    const code =
      existing?.code && existing.code !== "0000"
        ? existing.code
        : String(Math.floor(1000 + Math.random() * 9000));

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

/**
 * DELETE /api/admin/session?session=YYYY-MM-DD
 * Elimina un pase de lista completo; su asistencia se borra en cascada.
 */
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const sessionId = req.nextUrl.searchParams.get("session") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionId)) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400 });
  }

  const { error } = await db().from("sessions").delete().eq("id", sessionId);
  if (error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
