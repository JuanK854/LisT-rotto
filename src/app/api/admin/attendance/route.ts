import { NextRequest, NextResponse } from "next/server";
import { db, todaySessionId } from "@/lib/supabase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attendance?session=YYYY-MM-DD
 * Lista completa de alumnos con su estado de asistencia para esa sesión
 * (por defecto, la de hoy).
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const sessionId =
    req.nextUrl.searchParams.get("session") || todaySessionId();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionId)) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400 });
  }

  const [studentsRes, attendanceRes] = await Promise.all([
    db().from("students").select("id, name").eq("active", true).order("name"),
    db()
      .from("attendance")
      .select("student_id, marked_by, checked_in_at")
      .eq("session_id", sessionId),
  ]);

  if (studentsRes.error || attendanceRes.error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  const attendance = new Map(
    attendanceRes.data.map((a) => [a.student_id, a])
  );

  const students = studentsRes.data.map((s) => {
    const record = attendance.get(s.id);
    return {
      id: s.id,
      name: s.name,
      present: !!record,
      markedBy: record?.marked_by ?? null,
      checkedInAt: record?.checked_in_at ?? null,
    };
  });

  return NextResponse.json({ sessionId, students });
}

/**
 * POST /api/admin/attendance  { studentId, sessionId?, present: boolean }
 * Marca o desmarca manualmente a un alumno.
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  let body: { studentId?: string; sessionId?: string; present?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
  const sessionId = body.sessionId || todaySessionId();
  if (!studentId || !/^\d{4}-\d{2}-\d{2}$/.test(sessionId) || typeof body.present !== "boolean") {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  if (body.present) {
    const { data: student } = await db()
      .from("students")
      .select("id, name")
      .eq("id", studentId)
      .maybeSingle();
    if (!student) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }
    // La sesión debe existir para respetar la llave foránea (marcar en fechas pasadas)
    await db()
      .from("sessions")
      .upsert({ id: sessionId, code: "0000", open: false }, { ignoreDuplicates: true });

    const { error } = await db().from("attendance").upsert({
      session_id: sessionId,
      student_id: studentId,
      student_name: student.name,
      marked_by: "admin",
    });
    if (error) {
      return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
  } else {
    await db()
      .from("attendance")
      .delete()
      .eq("session_id", sessionId)
      .eq("student_id", studentId);
  }

  return NextResponse.json({ ok: true });
}
