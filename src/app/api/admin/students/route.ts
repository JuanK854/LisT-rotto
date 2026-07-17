import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * POST /api/admin/students  { name, phone? }
 * Da de alta un integrante nuevo (o reactiva uno existente con el mismo nombre).
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  let body: { name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 3 || name.length > 120) {
    return NextResponse.json(
      { error: "Escribe el nombre completo (mínimo 3 letras)" },
      { status: 400 }
    );
  }

  // Teléfono opcional. 10 dígitos sin lada → se asume México (+52);
  // con "+" acepta la lada de cualquier país (E.164: hasta 15 dígitos).
  let phone: string | null = null;
  if (typeof body.phone === "string" && body.phone.trim()) {
    const digits = body.phone.replace(/[^\d+]/g, "");
    phone = /^\d{10}$/.test(digits) ? `+52${digits}` : digits;
    if (!/^\+\d{8,15}$/.test(phone)) {
      return NextResponse.json(
        { error: "Teléfono inválido: usa 10 dígitos (México) o formato internacional +…" },
        { status: 400 }
      );
    }
  }

  // Mismo id determinista que el importador: el nombre repetido no se duplica
  const id = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!id) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const { data: existing } = await db()
    .from("students")
    .select("id, active")
    .eq("id", id)
    .maybeSingle();

  if (existing?.active) {
    return NextResponse.json(
      { error: "Esa persona ya está en la lista" },
      { status: 409 }
    );
  }

  // Sin teléfono no se manda la columna: reactivar a alguien no borra el que ya tenía
  const { error } = await db().from("students").upsert({
    id,
    name,
    name_normalized: normalize(name),
    active: true,
    ...(phone ? { phone } : {}),
  });
  if (error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, name });
}
