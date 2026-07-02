import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/sessions — fechas de todas las sesiones (para el historial). */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const snap = await db().collection("sessions").orderBy("date", "desc").get();
  return NextResponse.json({
    sessions: snap.docs.map((d) => ({ id: d.id, open: d.data().open === true })),
  });
}
