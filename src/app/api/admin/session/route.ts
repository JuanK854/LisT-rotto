import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db, todaySessionId } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/session — estado de la sesión de hoy (incluye el código). */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  const sessionId = todaySessionId();
  const snap = await db().collection("sessions").doc(sessionId).get();
  if (!snap.exists) {
    return NextResponse.json({ sessionId, exists: false });
  }
  const data = snap.data()!;
  return NextResponse.json({
    sessionId,
    exists: true,
    open: data.open === true,
    code: data.code,
  });
}

/**
 * POST /api/admin/session  { action: "open" | "close" }
 * "open" crea la sesión de hoy con un código nuevo (o la reabre).
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const sessionId = todaySessionId();
  const ref = db().collection("sessions").doc(sessionId);

  if (body.action === "open") {
    const snap = await ref.get();
    const code = snap.exists
      ? (snap.data()!.code as string)
      : String(Math.floor(1000 + Math.random() * 9000));

    await ref.set(
      {
        date: sessionId,
        code,
        open: true,
        createdAt: snap.exists ? snap.data()!.createdAt : FieldValue.serverTimestamp(),
        openedBy: admin.email,
      },
      { merge: true }
    );
    return NextResponse.json({ sessionId, open: true, code });
  }

  if (body.action === "close") {
    await ref.set({ open: false }, { merge: true });
    return NextResponse.json({ sessionId, open: false });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
