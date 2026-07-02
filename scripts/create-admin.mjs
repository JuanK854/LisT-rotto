// Crea (o actualiza) un usuario admin en Supabase Auth.
// Uso:  node --env-file=.env.local scripts/create-admin.mjs email password
// Recuerda agregar el email a ADMIN_EMAILS en .env.local y en Vercel.

import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Uso: node --env-file=.env.local scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
console.log(`Usuario admin creado: ${data.user.email}`);
