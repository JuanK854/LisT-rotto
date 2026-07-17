// Carga/actualiza teléfonos de los alumnos en Supabase.
// Uso:  node --env-file=.env.local scripts/set-phones.mjs telefonos.csv
// El CSV lleva dos columnas: nombre,telefono (con o sin encabezado).
// El nombre se compara sin acentos ni mayúsculas; avisa los que no encuentre.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node --env-file=.env.local scripts/set-phones.mjs <archivo.csv>");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);

const normalize = (t) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const rows = readFileSync(file, "utf8")
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "").trim()))
  .filter((cols) => cols[0] && cols[1])
  .filter((cols, i) => !(i === 0 && /^nombres?$/i.test(cols[0])));

if (rows.length === 0) {
  console.error("El archivo no tiene filas nombre,telefono.");
  process.exit(1);
}

const { data: students, error } = await db
  .from("students")
  .select("id, name, name_normalized");
if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

let updated = 0;
const missing = [];
for (const [name, phone] of rows) {
  const student = students.find((s) => s.name_normalized === normalize(name));
  if (!student) {
    missing.push(name);
    continue;
  }
  const { error: upErr } = await db
    .from("students")
    .update({ phone })
    .eq("id", student.id);
  if (upErr) {
    console.error(`Error con ${name}:`, upErr.message);
    process.exit(1);
  }
  updated++;
}

console.log(`Teléfonos actualizados: ${updated}`);
if (missing.length) {
  console.log("No encontrados en la base:", missing.join("; "));
}
const withoutPhone = students.filter(
  (s) => !rows.some(([n]) => normalize(n) === s.name_normalized)
);
if (withoutPhone.length) {
  console.log("Alumnos sin teléfono en este archivo:");
  withoutPhone.forEach((s) => console.log(" -", s.name));
}
