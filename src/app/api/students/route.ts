import { NextResponse } from "next/server";
import { db, todaySessionId } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/students
 * Lista pública mínima: solo id + nombre de alumnos activos y si hay sesión.
 * No expone quién asistió: eso solo lo ve el admin.
 */
export async function GET() {
  const sessionId = todaySessionId();

  const [studentsRes, sessionRes] = await Promise.all([
    db().from("students").select("id, name").eq("active", true).order("name"),
    db().from("sessions").select("open").eq("id", sessionId).maybeSingle(),
  ]);

  if (studentsRes.error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  return NextResponse.json({
    sessionOpen: sessionRes.data?.open === true,
    sessionId,
    students: studentsRes.data,
  });
}
