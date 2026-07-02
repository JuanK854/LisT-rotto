import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * GET /api/admin/export
 * CSV del historial completo: una fila por alumno, una columna por sesión.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const [studentsSnap, sessionsSnap, attendanceSnap] = await Promise.all([
    db().collection("students").where("active", "==", true).get(),
    db().collection("sessions").orderBy("date").get(),
    db().collection("attendance").get(),
  ]);

  const sessions = sessionsSnap.docs.map((d) => d.id);
  const present = new Set(attendanceSnap.docs.map((d) => d.id));

  const students = studentsSnap.docs
    .map((d) => ({ id: d.id, name: d.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const header = ["Nombre", ...sessions, "Total"].join(",");
  const rows = students.map((s) => {
    const marks = sessions.map((sess) =>
      present.has(`${sess}_${s.id}`) ? "1" : "0"
    );
    const total = marks.filter((m) => m === "1").length;
    return [csvEscape(s.name), ...marks, String(total)].join(",");
  });

  // BOM para que Excel abra bien los acentos
  const csv = "﻿" + [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asistencia.csv"`,
    },
  });
}
