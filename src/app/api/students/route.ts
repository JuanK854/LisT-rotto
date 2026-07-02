import { NextResponse } from "next/server";
import { db, todaySessionId } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/students
 * Lista pública mínima: id + nombre de alumnos activos, estado de la sesión
 * de hoy y quiénes ya se marcaron (para mostrar "ya registrado").
 */
export async function GET() {
  const sessionId = todaySessionId();

  const [studentsRes, sessionRes, attendanceRes] = await Promise.all([
    db().from("students").select("id, name").eq("active", true).order("name"),
    db().from("sessions").select("open").eq("id", sessionId).maybeSingle(),
    db().from("attendance").select("student_id").eq("session_id", sessionId),
  ]);

  if (studentsRes.error || attendanceRes.error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  const present = new Set(attendanceRes.data.map((a) => a.student_id));

  return NextResponse.json({
    sessionOpen: sessionRes.data?.open === true,
    sessionId,
    students: studentsRes.data.map((s) => ({
      id: s.id,
      name: s.name,
      present: present.has(s.id),
    })),
  });
}
