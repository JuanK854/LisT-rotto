// Importa la lista de alumnos a Supabase.
// Uso:  node --env-file=.env.local scripts/import-students.mjs lista.csv
// El CSV puede ser una columna de nombres (con o sin encabezado "nombre").

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node --env-file=.env.local scripts/import-students.mjs <archivo.csv>");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);

const normalize = (t) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const lines = readFileSync(file, "utf8")
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .map((l) => l.split(",")[0].replace(/^"|"$/g, "").trim())
  .filter(Boolean)
  .filter((l, i) => !(i === 0 && /^nombres?$/i.test(l)));

if (lines.length === 0) {
  console.error("El archivo no tiene nombres.");
  process.exit(1);
}

const rows = lines.map((name) => ({
  // ID determinista a partir del nombre normalizado: re-ejecutar no duplica
  id: normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  name,
  name_normalized: normalize(name),
  active: true,
}));

const { error } = await db.from("students").upsert(rows);
if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
console.log(`Importados/actualizados ${rows.length} alumnos.`);
