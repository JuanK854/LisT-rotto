import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/sessions — fechas de todas las sesiones (para el historial). */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const { data, error } = await db()
    .from("sessions")
    .select("id, open")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
  return NextResponse.json({ sessions: data });
}
