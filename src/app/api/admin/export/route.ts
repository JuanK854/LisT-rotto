import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// El teléfono se guarda en E.164 (+52…). Sin esto, Excel toma el "+" como
// una fórmula y lo convierte a notación científica (5.26145E+11), perdiendo
// dígitos. El patrón ="…" obliga a Excel/Sheets a mostrarlo tal cual, como texto.
function phoneCell(phone: string | null | undefined): string {
  if (!phone) return "";
  return `"=""${phone.replace(/"/g, '""')}"""`;
}

/**
 * GET /api/admin/export
 * CSV del historial completo: una fila por alumno, una columna por sesión.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const [studentsRes, sessionsRes, attendanceRes] = await Promise.all([
    db().from("students").select("id, name, phone").eq("active", true).order("name"),
    db().from("sessions").select("id").order("id"),
    db().from("attendance").select("session_id, student_id"),
  ]);

  if (studentsRes.error || sessionsRes.error || attendanceRes.error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  const sessions = sessionsRes.data.map((s) => s.id);
  const present = new Set(
    attendanceRes.data.map((a) => `${a.session_id}_${a.student_id}`)
  );

  const header = ["Nombre", ...sessions, "Total", "Teléfono"].join(",");
  const rows = studentsRes.data.map((s) => {
    const marks = sessions.map((sess) =>
      present.has(`${sess}_${s.id}`) ? "1" : "0"
    );
    const total = marks.filter((m) => m === "1").length;
    return [csvEscape(s.name), ...marks, String(total), phoneCell(s.phone)].join(",");
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
