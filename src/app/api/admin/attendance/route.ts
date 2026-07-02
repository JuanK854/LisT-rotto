import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db, todaySessionId } from "@/lib/firebase-admin";
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

  const [studentsSnap, attendanceSnap] = await Promise.all([
    db().collection("students").where("active", "==", true).get(),
    db().collection("attendance").where("sessionId", "==", sessionId).get(),
  ]);

  const attendance = new Map(
    attendanceSnap.docs.map((d) => [d.data().studentId as string, d.data()])
  );

  const students = studentsSnap.docs
    .map((d) => {
      const record = attendance.get(d.id);
      return {
        id: d.id,
        name: d.data().name as string,
        present: !!record,
        markedBy: record?.markedBy ?? null,
        checkedInAt: record?.checkedInAt?.toDate?.()?.toISOString() ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

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

  const attendanceId = `${sessionId}_${studentId}`;
  const ref = db().collection("attendance").doc(attendanceId);

  if (body.present) {
    const studentSnap = await db().collection("students").doc(studentId).get();
    if (!studentSnap.exists) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }
    await ref.set({
      studentId,
      studentName: studentSnap.data()?.name ?? "",
      sessionId,
      checkedInAt: FieldValue.serverTimestamp(),
      markedBy: "admin",
    });
  } else {
    await ref.delete();
  }

  return NextResponse.json({ ok: true });
}
