import { NextResponse } from "next/server";
import { db, todaySessionId } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/students
 * Lista pública mínima: id + nombre de alumnos activos, estado de la sesión
 * de hoy y quiénes ya se marcaron (para mostrar "ya registrado").
 */
export async function GET() {
  const sessionId = todaySessionId();

  const [studentsSnap, sessionSnap, attendanceSnap] = await Promise.all([
    db().collection("students").where("active", "==", true).get(),
    db().collection("sessions").doc(sessionId).get(),
    db().collection("attendance").where("sessionId", "==", sessionId).get(),
  ]);

  const students = studentsSnap.docs
    .map((d) => ({ id: d.id, name: d.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const present = new Set(attendanceSnap.docs.map((d) => d.data().studentId));

  return NextResponse.json({
    sessionOpen: sessionSnap.exists && sessionSnap.data()?.open === true,
    sessionId,
    students: students.map((s) => ({ ...s, present: present.has(s.id) })),
  });
}
