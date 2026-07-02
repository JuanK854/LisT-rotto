import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Cliente de servidor con la llave secreta: acceso total, NUNCA se expone al navegador. */
export function db(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY)"
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Fecha local de la sesión en formato YYYY-MM-DD (zona horaria del curso). */
export function todaySessionId(): string {
  const tz = process.env.COURSE_TIMEZONE || "America/Mexico_City";
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}
