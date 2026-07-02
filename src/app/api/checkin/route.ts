import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db, todaySessionId } from "@/lib/firebase-admin";
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
  const sessionSnap = await db().collection("sessions").doc(sessionId).get();
  if (!sessionSnap.exists || sessionSnap.data()?.open !== true) {
    return NextResponse.json(
      { error: "No hay una sesión abierta hoy" },
      { status: 409 }
    );
  }
  if (sessionSnap.data()?.code !== code) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 403 });
  }

  const studentSnap = await db().collection("students").doc(studentId).get();
  if (!studentSnap.exists || studentSnap.data()?.active !== true) {
    return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
  }

  const attendanceId = `${sessionId}_${studentId}`;
  const ref = db().collection("attendance").doc(attendanceId);
  const existing = await ref.get();
  if (existing.exists) {
    return NextResponse.json({ ok: true, alreadyChecked: true });
  }

  await ref.create({
    studentId,
    studentName: studentSnap.data()?.name ?? "",
    sessionId,
    checkedInAt: FieldValue.serverTimestamp(),
    markedBy: "self",
  });

  return NextResponse.json({ ok: true, alreadyChecked: false });
}
