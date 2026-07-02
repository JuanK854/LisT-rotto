import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sessions
 * Fechas de todas las sesiones con su número de asistentes (para el historial).
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const [sessionsRes, attendanceRes] = await Promise.all([
    db().from("sessions").select("id, open").order("id", { ascending: false }),
    db().from("attendance").select("session_id"),
  ]);

  if (sessionsRes.error || attendanceRes.error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const a of attendanceRes.data) {
    counts.set(a.session_id, (counts.get(a.session_id) ?? 0) + 1);
  }

  return NextResponse.json({
    sessions: sessionsRes.data.map((s) => ({
      id: s.id,
      open: s.open === true,
      present: counts.get(s.id) ?? 0,
    })),
  });
}
