import { NextRequest, NextResponse } from "next/server";
import { db, todaySessionId } from "@/lib/supabase-admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkin  { studentId, code }
 * Check-in del alumno: valida sesión abierta + código del día.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`checkin:${clientIp(req.headers)}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera un momento" },
      { status: 429 }
    );
  }

  let body: { studentId?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!studentId || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const sessionId = todaySessionId();
  const { data: session } = await db()
    .from("sessions")
    .select("open, code")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session?.open) {
    return NextResponse.json(
      { error: "No hay una sesión abierta hoy" },
      { status: 409 }
    );
  }
  if (session.code !== code) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 403 });
  }

  const { data: student } = await db()
    .from("students")
    .select("id, name")
    .eq("id", studentId)
    .eq("active", true)
    .maybeSingle();

  if (!student) {
    return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
  }

  const { error } = await db().from("attendance").insert({
    session_id: sessionId,
    student_id: studentId,
    student_name: student.name,
    marked_by: "self",
  });

  // 23505 = ya existía (llave primaria compuesta): check-in duplicado, no es error
  if (error && error.code === "23505") {
    return NextResponse.json({ ok: true, alreadyChecked: true });
  }
  if (error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyChecked: false });
}
